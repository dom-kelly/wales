import { useEffect, useState, useCallback, useRef } from 'react';
import { readPhotoExif } from './exif.js';

// In dev, hits the vite dev server which won't have the function;
// in prod, /api/state hits the Cloudflare Pages Function.
const API_URL = '/api/state';

async function fetchState() {
  try {
    const r = await fetch(API_URL);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('Failed to fetch shared state, using empty:', e);
    return {};
  }
}

async function saveState(state) {
  try {
    const r = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!r.ok) throw new Error(`status ${r.status}`);
  } catch (e) {
    console.warn('Failed to save shared state:', e);
  }
}

/**
 * Returns [state, setState] backed by Cloudflare KV via the /api/state endpoint.
 * Falls back to localStorage in dev or if the API is unavailable.
 * Debounces writes to avoid hammering the API.
 */
export function useSharedState(namespace, initial = {}) {
  const [state, setState] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  // Load on mount
  useEffect(() => {
    let cancelled = false;
    fetchState().then(remote => {
      if (cancelled) return;
      const local = JSON.parse(localStorage.getItem(`wales:${namespace}`) || '{}');
      // Merge remote with local — remote wins where both have the same key
      setState({ ...initial, ...local, ...(remote[namespace] || {}) });
      setLoaded(true);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  // Persist on change (debounced 400ms)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`wales:${namespace}`, JSON.stringify(state));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // Fetch the latest full doc, merge our namespace into it, save
      const remote = await fetchState();
      await saveState({ ...remote, [namespace]: state });
    }, 400);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [state, loaded, namespace]);

  const update = useCallback((updater) => {
    setState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  return [state, update, loaded];
}

const PHOTOS_API = '/api/photos';
const PASSWORD_KEY = 'wales:admin';

function getStoredPassword() {
  try { return localStorage.getItem(PASSWORD_KEY) || ''; }
  catch { return ''; }
}

function setStoredPassword(pw) {
  try {
    if (pw) localStorage.setItem(PASSWORD_KEY, pw);
    else localStorage.removeItem(PASSWORD_KEY);
  } catch { /* ignore */ }
}

/**
 * Returns { password, setPassword(pw), hasPassword }. Persisted in localStorage.
 * The password is sent as Authorization: Bearer <pw> on protected requests.
 *
 * setPassword is async and checks with the server before storing, resolving to
 * { ok } or { ok: false, error }. Passing '' locks again without a round trip.
 */
export function useAuth() {
  const [password, setPassword] = useState(() => getStoredPassword());

  const update = useCallback(async (pw) => {
    const trimmed = (pw || '').trim();
    if (!trimmed) {
      setStoredPassword('');
      setPassword('');
      return { ok: true };
    }
    let r;
    try {
      r = await fetch('/api/auth', {
        method: 'POST',
        headers: { Authorization: `Bearer ${trimmed}` },
      });
    } catch {
      return { ok: false, error: "Couldn't reach the server — check your connection." };
    }
    if (r.status === 401) return { ok: false, error: "That password wasn't accepted." };
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      return { ok: false, error: body.error || `Server error (${r.status}).` };
    }
    setStoredPassword(trimmed);
    setPassword(trimmed);
    return { ok: true };
  }, []);

  return { password, setPassword: update, hasPassword: !!password };
}

const CHECKIN_API = '/api/checkin';

function currentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("This browser can't share a location."));
  }
  // Geolocation is refused outside a secure context, which includes visiting a
  // dev server by LAN IP over plain http.
  if (!window.isSecureContext) {
    return Promise.reject(new Error('Location needs https (or localhost) — try the deployed site.'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, err => {
      const messages = {
        1: 'Location permission denied — allow it in your browser settings.',
        2: "Couldn't get a fix. Try again outdoors.",
        3: 'Timed out looking for a fix. Try again.',
      };
      reject(new Error(messages[err.code] || 'Location unavailable.'));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
}

/**
 * The shared "we are here now" pin. Anyone can read it; only someone with the
 * password can move or clear it.
 */
export function useCheckin(pollMs = 60000) {
  const [checkin, setCheckin] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(CHECKIN_API);
      if (!r.ok) return;
      const data = await r.json();
      setCheckin(data && Number.isFinite(data.lat) ? data : null);
    } catch { /* offline — keep whatever we last saw */ }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const checkIn = useCallback(async () => {
    const pw = getStoredPassword();
    if (!pw) throw new Error('Trip password not set');
    setBusy(true);
    try {
      const pos = await currentPosition();
      const params = new URLSearchParams({
        lat: String(pos.coords.latitude),
        lng: String(pos.coords.longitude),
      });
      if (Number.isFinite(pos.coords.accuracy)) params.set('accuracy', String(pos.coords.accuracy));
      const r = await fetch(`${CHECKIN_API}?${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (r.status === 401) {
        setStoredPassword('');
        throw new Error('Wrong password — cleared. Set it again.');
      }
      if (!r.ok) throw new Error(`Check-in failed: ${r.status}`);
      setCheckin(await r.json());
    } finally {
      setBusy(false);
    }
  }, []);

  const clearCheckin = useCallback(async () => {
    const pw = getStoredPassword();
    if (!pw) throw new Error('Trip password not set');
    setBusy(true);
    try {
      const r = await fetch(CHECKIN_API, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (!r.ok) throw new Error(`Couldn't clear check-in: ${r.status}`);
      setCheckin(null);
    } finally {
      setBusy(false);
    }
  }, []);

  return { checkin, checkIn, clearCheckin, busy };
}

async function fetchPhotos() {
  try {
    const r = await fetch(PHOTOS_API);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('Failed to fetch photos:', e);
    return [];
  }
}

async function compressImage(file, maxDim = 1600, quality = 0.85) {
  // from-image applies the EXIF orientation tag, so portrait phone shots don't
  // come out on their side once the canvas strips that tag.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality)
  );
}

/**
 * Lists photo metadata (polled every `pollMs`) and exposes `upload(file, meta)`
 * which compresses the image and posts the bytes to /api/photos.
 */
export function usePhotos(pollMs = 60000) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    const list = await fetchPhotos();
    setPhotos(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const upload = useCallback(async (file, meta) => {
    setUploading(true);
    try {
      const pw = getStoredPassword();
      if (!pw) throw new Error('Trip password not set');

      // Where and when the photo was taken comes from its own EXIF. The Photos
      // tab already read it to pick a day, so only parse again if it didn't.
      const exif = meta.lat != null && meta.takenAt != null ? {} : await readPhotoExif(file);
      const lat = meta.lat ?? exif.lat;
      const lng = meta.lng ?? exif.lng;
      // Fall back to the file's modified date so the gallery still sorts by
      // roughly when a photo was taken rather than when it was uploaded.
      const takenAt = meta.takenAt
        ?? (exif.takenAt ? exif.takenAt.getTime() : null)
        ?? file.lastModified
        ?? null;

      const blob = await compressImage(file);
      const params = new URLSearchParams();
      params.set('dayNum', String(meta.dayNum));
      if (meta.stopIndex != null) params.set('stopIndex', String(meta.stopIndex));
      if (meta.caption) params.set('caption', meta.caption);
      if (lat != null && lng != null) {
        params.set('lat', String(lat));
        params.set('lng', String(lng));
      }
      if (takenAt != null) params.set('takenAt', String(takenAt));
      // Recorded so a photo that files itself oddly can be explained after the
      // fact — which container the browser handed us, and the file's own mtime.
      if (meta.format || exif.format) params.set('srcFormat', meta.format || exif.format);
      if (meta.magic || exif.magic) params.set('srcMagic', meta.magic || exif.magic);
      if (file.lastModified) params.set('srcModified', String(file.lastModified));
      const r = await fetch(`${PHOTOS_API}?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${pw}` },
        body: blob,
      });
      if (r.status === 401) {
        setStoredPassword('');
        throw new Error('Wrong password — cleared. Set it again.');
      }
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
      const record = await r.json();
      await refresh();
      return record;
    } finally {
      setUploading(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id) => {
    const pw = getStoredPassword();
    if (!pw) throw new Error('Trip password not set');
    const r = await fetch(`${PHOTOS_API}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${pw}` },
    });
    if (r.status === 401) {
      setStoredPassword('');
      throw new Error('Wrong password — cleared. Set it again.');
    }
    if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
    await refresh();
  }, [refresh]);

  return { photos, loading, uploading, upload, remove, refresh };
}
