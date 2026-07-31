// Minimal EXIF reader: pulls GPS coordinates and the capture time out of a
// JPEG. We only parse the two tags we need rather than pulling in a library.
//
// Must run on the original File — compressImage() draws through a canvas,
// which discards every EXIF tag.

const HEAD_BYTES = 256 * 1024; // EXIF lives in an APP1 segment near the start

const TAG = {
  EXIF_IFD: 0x8769,
  GPS_IFD: 0x8825,
  DATE_TIME_ORIGINAL: 0x9003,
  GPS_LAT_REF: 0x0001,
  GPS_LAT: 0x0002,
  GPS_LNG_REF: 0x0003,
  GPS_LNG: 0x0004,
};

// Bytes per component, indexed by EXIF type code.
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

// Walks JPEG segment markers looking for APP1/"Exif\0\0". Returns the offset of
// the TIFF header that follows it, or -1.
function findTiffHeader(view) {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return -1;
  let off = 2;
  while (off + 4 <= view.byteLength) {
    if (view.getUint8(off) !== 0xff) return -1; // lost sync, give up
    const marker = view.getUint8(off + 1);
    // Standalone markers carry no length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      off += 2;
      continue;
    }
    if (marker === 0xda) return -1; // start of scan — image data, no EXIF
    const len = view.getUint16(off + 2);
    if (len < 2) return -1;
    if (marker === 0xe1 && off + 10 <= view.byteLength &&
        view.getUint32(off + 4) === 0x45786966 && view.getUint16(off + 8) === 0x0000) {
      return off + 10;
    }
    off += 2 + len;
  }
  return -1;
}

// Reads one image file directory into a tag -> {type, count, at} map.
function readIfd(view, tiff, ifdOffset, le) {
  const entries = new Map();
  const base = tiff + ifdOffset;
  if (base < 0 || base + 2 > view.byteLength) return entries;
  const count = view.getUint16(base, le);
  for (let i = 0; i < count; i++) {
    const e = base + 2 + i * 12;
    if (e + 12 > view.byteLength) break;
    const type = view.getUint16(e + 2, le);
    const n = view.getUint32(e + 4, le);
    const size = (TYPE_SIZE[type] || 0) * n;
    if (!size) continue;
    // Values of 4 bytes or fewer sit inline; anything larger is a pointer.
    const at = size <= 4 ? e + 8 : tiff + view.getUint32(e + 8, le);
    if (at < 0 || at + size > view.byteLength) continue;
    entries.set(view.getUint16(e, le), { type, count: n, at });
  }
  return entries;
}

function readAscii(view, entry) {
  let s = '';
  for (let i = 0; i < entry.count; i++) {
    const c = view.getUint8(entry.at + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

function readRationals(view, entry, le) {
  const out = [];
  for (let i = 0; i < entry.count; i++) {
    const num = view.getUint32(entry.at + i * 8, le);
    const den = view.getUint32(entry.at + i * 8 + 4, le);
    out.push(den ? num / den : 0);
  }
  return out;
}

function dmsToDecimal(dms, ref) {
  if (!dms || dms.length < 3) return null;
  const dec = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (!Number.isFinite(dec)) return null;
  return ref === 'S' || ref === 'W' ? -dec : dec;
}

// EXIF timestamps are "YYYY:MM:DD HH:MM:SS" with no timezone, so they're read
// as local time — which is what we want for a UK road trip.
function parseExifDate(s) {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return Number.isNaN(d.getTime()) ? null : d;
}

// What container the browser actually handed us. iOS may transcode a HEIC
// library photo to JPEG on the way into a file input, or may not — and the
// answer decides whether any EXIF survives at all.
function detectFormat(view) {
  if (view.byteLength >= 2 && view.getUint16(0) === 0xffd8) return 'JPEG';
  if (view.byteLength >= 12 && view.getUint32(4) === 0x66747970) { // 'ftyp'
    const brand = String.fromCharCode(
      view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    return /heic|heix|hevc|heim|hevm|mif1|msf1/.test(brand) ? 'HEIC' : brand.trim().toUpperCase();
  }
  if (view.byteLength >= 8 && view.getUint32(0) === 0x89504e47) return 'PNG';
  return 'unknown';
}

/**
 * Reads { lat, lng, takenAt, format } from a photo's EXIF. Any field the photo
 * doesn't carry is simply absent; `format` is always reported so callers can
 * explain *why* nothing was found.
 */
export async function readPhotoExif(file) {
  let format = 'unknown';
  let magic = '';
  try {
    const view = new DataView(await file.slice(0, HEAD_BYTES).arrayBuffer());
    format = detectFormat(view);
    // First bytes in hex — distinguishes "container we don't know" from "the
    // browser handed us an empty read", which look identical otherwise.
    magic = Array.from({ length: Math.min(12, view.byteLength) },
      (_, i) => view.getUint8(i).toString(16).padStart(2, '0')).join('');

    const tiff = findTiffHeader(view);
    if (tiff < 0 || tiff + 8 > view.byteLength) return { format, magic };

    const endian = view.getUint16(tiff);
    if (endian !== 0x4949 && endian !== 0x4d4d) return { format, magic };
    const le = endian === 0x4949;
    if (view.getUint16(tiff + 2, le) !== 0x002a) return { format, magic };

    const ifd0 = readIfd(view, tiff, view.getUint32(tiff + 4, le), le);
    const result = { format, magic };

    const gpsPtr = ifd0.get(TAG.GPS_IFD);
    if (gpsPtr) {
      const gps = readIfd(view, tiff, view.getUint32(gpsPtr.at, le), le);
      const latE = gps.get(TAG.GPS_LAT);
      const lngE = gps.get(TAG.GPS_LNG);
      if (latE && lngE) {
        const latRef = gps.get(TAG.GPS_LAT_REF);
        const lngRef = gps.get(TAG.GPS_LNG_REF);
        const lat = dmsToDecimal(readRationals(view, latE, le), latRef ? readAscii(view, latRef) : 'N');
        const lng = dmsToDecimal(readRationals(view, lngE, le), lngRef ? readAscii(view, lngRef) : 'E');
        // Some cameras write a null island 0,0 when they never got a fix.
        if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
          result.lat = lat;
          result.lng = lng;
        }
      }
    }

    const exifPtr = ifd0.get(TAG.EXIF_IFD);
    if (exifPtr) {
      const exif = readIfd(view, tiff, view.getUint32(exifPtr.at, le), le);
      const dt = exif.get(TAG.DATE_TIME_ORIGINAL);
      const taken = dt ? parseExifDate(readAscii(view, dt)) : null;
      if (taken) result.takenAt = taken;
    }

    return result;
  } catch {
    return { format, magic }; // unreadable metadata isn't an error worth surfacing
  }
}
