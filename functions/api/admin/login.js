import { createSession, json, sessionCookie } from './_auth.js';

export async function onRequestPost({ request, env }) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ success: false, error: 'İstek biçimi geçersiz.' }, 415);
  }
  let body;
  try { body = await request.json(); } catch { return json({ success: false, error: 'Geçersiz JSON isteği.' }, 400); }
  const password = typeof body?.password === 'string' ? body.password : '';
  // ADMIN_PASSWORD Cloudflare Pages > Settings > Environment variables içinde tanımlanmalıdır.
  // Fallback only preserves the existing classroom password until the environment secret is configured.
  const expected = env.ADMIN_PASSWORD || '273147';
  if (!password || password !== expected) return json({ success: false, error: 'Admin girişi başarısız.' }, 401);
  const token = await createSession(env);
  return json({ success: true }, 200, { 'set-cookie': sessionCookie(token) });
}
export async function onRequest({ request }) {
  return json({ success: false, error: 'Yalnızca POST isteği kabul edilir.' }, 405, { allow: 'POST' });
}
