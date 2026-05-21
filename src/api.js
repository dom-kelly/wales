import { useEffect, useState, useCallback, useRef } from 'react';

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
 */
export function useAuth() {
  const [password, setPassword] = useState(() => getStoredPassword());
  const update = useCallback(pw => {
    setStoredPassword(pw);
    setPassword(pw);
  }, []);
  return { password, setPassword: update, hasPassword: !!password };
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
  const bitmap = await createImageBitmap(file);
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
      if (!pw) throw new Error('Driver password not set');
      const blob = await compressImage(file);
      const params = new URLSearchParams();
      params.set('dayNum', String(meta.dayNum));
      if (meta.stopIndex != null) params.set('stopIndex', String(meta.stopIndex));
      if (meta.caption) params.set('caption', meta.caption);
      if (meta.lat != null && meta.lng != null) {
        params.set('lat', String(meta.lat));
        params.set('lng', String(meta.lng));
      }
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
    if (!pw) throw new Error('Driver password not set');
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
