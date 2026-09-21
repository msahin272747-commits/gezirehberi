import { expiredSessionCookie, json } from './_auth.js';
export async function onRequestPost() { return json({ success: true }, 200, { 'set-cookie': expiredSessionCookie }); }
export async function onRequest() { return json({ success: false, error: 'Yalnızca POST isteği kabul edilir.' }, 405, { allow: 'POST' }); }
