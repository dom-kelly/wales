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
