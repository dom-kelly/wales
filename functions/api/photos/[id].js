// Cloudflare Pages Function: /api/photos/:id
// GET    → streams the photo binary from R2
// DELETE → removes the R2 object and its KV metadata entry

const META_KEY = 'photos';

export async function onRequestGet({ env, params }) {
  if (!env.PHOTOS) {
    return new Response(JSON.stringify({ error: 'R2 not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = params.id;
  const candidates = [`${id}.jpg`, `${id}.jpeg`, `${id}.png`];
  let object = null;
  for (const key of candidates) {
    object = await env.PHOTOS.get(key);
    if (object) break;
  }
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

export async function onRequestDelete({ env, params, request }) {
  if (!env.TRIP_STATE) return jsonErr(503, 'KV not configured');
  if (!env.PHOTOS) return jsonErr(503, 'R2 not configured');
  if (!env.ADMIN_PASSWORD) return jsonErr(503, 'ADMIN_PASSWORD not configured on the server');
  const header = request.headers.get('Authorization') || '';
  if (header !== `Bearer ${env.ADMIN_PASSWORD}`) return jsonErr(401, 'Unauthorized');

  const id = params.id;
  const raw = await env.TRIP_STATE.get(META_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return jsonErr(404, 'Not found');

  const record = all[idx];
  await env.PHOTOS.delete(record.r2Key || `${id}.jpg`);
  all.splice(idx, 1);
  await env.TRIP_STATE.put(META_KEY, JSON.stringify(all));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonErr(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
