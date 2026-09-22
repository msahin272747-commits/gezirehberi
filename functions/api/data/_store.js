import { json, verifySession } from '../admin/_auth.js';

export { json, verifySession };
export async function readCollection(env, key) {
  if (!env.KOKUS_DATA) throw new Error('storage_unavailable');
  return JSON.parse((await env.KOKUS_DATA.get(key)) || '[]');
}
export async function writeCollection(env, key, value) {
  if (!env.KOKUS_DATA) throw new Error('storage_unavailable');
  await env.KOKUS_DATA.put(key, JSON.stringify(value));
}
export function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, max) : '';
}
export function storageError(error) {
  return error?.message === 'storage_unavailable'
    ? json({ success: false, error: 'Sunucu veri deposu yapılandırılmamış.' }, 503)
    : json({ success: false, error: 'İşlem başarısız.' }, 500);
}
