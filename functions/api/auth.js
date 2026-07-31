// Cloudflare Pages Function: /api/auth
// POST → validates an Authorization: Bearer <password> header.
//
// Exists so the UI can tell you the password is wrong the moment you enter it,
// rather than letting you pick a photo and write a caption first.

export async function onRequestPost({ env, request }) {
  if (!env.ADMIN_PASSWORD) {
    return json(503, { error: 'ADMIN_PASSWORD not configured on the server' });
  }
  const header = request.headers.get('Authorization') || '';
  if (header !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return json(401, { error: 'Unauthorized' });
  }
  return json(200, { ok: true });
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
