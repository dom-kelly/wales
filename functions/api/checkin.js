// Cloudflare Pages Function: /api/checkin
// GET    → the latest check-in, or {} if there isn't one. Public.
// POST   → record one (password-gated). Query: lat, lng.
// DELETE → clear it (password-gated).
//
// Writing is gated because the dot is visible to anyone with the link — only
// the people who can add photos should be able to move it.

const KEY = 'checkin';

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
  const raw = await env.TRIP_STATE.get(KEY);
  return json(raw ? JSON.parse(raw) : {});
}

export async function onRequestPost({ env, request }) {
  if (!env.TRIP_STATE) return jsonErr(503, 'KV not configured');
  const denied = checkAuth(env, request);
  if (denied) return denied;

  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') || '');
  const lng = parseFloat(url.searchParams.get('lng') || '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return jsonErr(400, 'lat and lng required');
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return jsonErr(400, 'lat/lng out of range');

  const accuracy = parseFloat(url.searchParams.get('accuracy') || '');
  const record = {
    lat,
    lng,
    at: Date.now(),
    ...(Number.isFinite(accuracy) ? { accuracy: Math.round(accuracy) } : {}),
  };
  await env.TRIP_STATE.put(KEY, JSON.stringify(record));
  return json(record);
}

export async function onRequestDelete({ env, request }) {
  if (!env.TRIP_STATE) return jsonErr(503, 'KV not configured');
  const denied = checkAuth(env, request);
  if (denied) return denied;
  await env.TRIP_STATE.delete(KEY);
  return json({ ok: true });
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
