// Cloudflare Pages Function: /api/state
// GET  → returns the full shared state object from KV
// PUT  → replaces the full shared state object in KV
//
// Requires a KV binding called TRIP_STATE on the Pages project.
// Set up in Cloudflare dashboard: Pages → your project → Settings → Functions → KV namespace bindings.

const KV_KEY = 'state';

export async function onRequestGet({ env }) {
  if (!env.TRIP_STATE) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const raw = await env.TRIP_STATE.get(KV_KEY);
  const state = raw ? JSON.parse(raw) : {};
  return new Response(JSON.stringify(state), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPut({ env, request }) {
  if (!env.TRIP_STATE) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  await env.TRIP_STATE.put(KV_KEY, JSON.stringify(body));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
