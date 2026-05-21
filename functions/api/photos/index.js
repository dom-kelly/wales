// Cloudflare Pages Function: /api/photos
// GET  → list photo metadata (small JSON array)
// POST → upload a JPEG. Body is raw bytes, query string holds metadata.
//
// Requires bindings:
//   - KV namespace TRIP_STATE  (metadata index)
//   - R2 bucket    PHOTOS      (binary blobs)

const META_KEY = 'photos';
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB ceiling — client should compress well under this

function checkAuth(env, request) {
  if (!env.ADMIN_PASSWORD) {
    return jsonErr(503, 'ADMIN_PASSWORD not configured on the server');
  }
  const header = request.headers.get('Authorization') || '';
  if (header !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return jsonErr(401, 'Unauthorized');
  }
  return null;
}

export async function onRequestGet({ env }) {
  if (!env.TRIP_STATE) return jsonErr(503, 'KV not configured');
  const raw = await env.TRIP_STATE.get(META_KEY);
  const meta = raw ? JSON.parse(raw) : [];
  return json(meta);
}

export async function onRequestPost({ env, request }) {
  if (!env.TRIP_STATE) return jsonErr(503, 'KV not configured');
  if (!env.PHOTOS) return jsonErr(503, 'R2 not configured');
  const denied = checkAuth(env, request);
  if (denied) return denied;

  const url = new URL(request.url);
  const dayNum = parseInt(url.searchParams.get('dayNum') || '', 10);
  const stopIndexRaw = url.searchParams.get('stopIndex');
  const stopIndex = stopIndexRaw == null || stopIndexRaw === '' ? null : parseInt(stopIndexRaw, 10);
  const caption = (url.searchParams.get('caption') || '').slice(0, 280);
  const lat = parseFloat(url.searchParams.get('lat') || '');
  const lng = parseFloat(url.searchParams.get('lng') || '');

  if (!Number.isFinite(dayNum)) return jsonErr(400, 'dayNum required');

  const contentType = request.headers.get('Content-Type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) return jsonErr(400, 'Body must be an image');

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return jsonErr(400, 'Empty body');
  if (bytes.byteLength > MAX_BYTES) return jsonErr(413, 'Image too large');

  const id = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const r2Key = `${id}.${ext}`;

  await env.PHOTOS.put(r2Key, bytes, { httpMetadata: { contentType } });

  const record = {
    id,
    r2Key,
    dayNum,
    stopIndex: Number.isFinite(stopIndex) ? stopIndex : null,
    caption,
    takenAt: Date.now(),
    mime: contentType,
    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
  };

  const existing = await env.TRIP_STATE.get(META_KEY);
  const all = existing ? JSON.parse(existing) : [];
  all.push(record);
  await env.TRIP_STATE.put(META_KEY, JSON.stringify(all));

  return json(record);
}

function json(body) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
function jsonErr(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
