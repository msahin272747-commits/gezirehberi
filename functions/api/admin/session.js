import { json, verifySession } from './_auth.js';
export async function onRequestGet({ request, env }) {
  const authenticated = await verifySession(request, env);
  return authenticated ? json({ success: true }) : json({ success: false, error: 'Yetkisiz istek.' }, 401);
}
