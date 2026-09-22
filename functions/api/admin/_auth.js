const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function secret(env) {
  return env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || '273147';
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value) {
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function sign(value, env) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function createSession(env) {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ role: 'admin', exp: Date.now() + 8 * 60 * 60 * 1000 })));
  return `${payload}.${await sign(payload, env)}`;
}

export async function verifySession(request, env) {
  const cookie = request.headers.get('cookie') || '';
  const raw = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('kokus_admin_session='))?.split('=').slice(1).join('');
  if (!raw) return false;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !constantTimeEqual(signature, await sign(payload, env))) return false;
  try {
    const session = JSON.parse(decoder.decode(base64UrlToBytes(payload)));
    return session.role === 'admin' && Number(session.exp) > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookie(token) {
  return `kokus_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export const expiredSessionCookie = 'kokus_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
