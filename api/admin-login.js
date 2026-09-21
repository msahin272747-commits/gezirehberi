// Vercel/Node serverless endpoint. ADMIN_PASSWORD deploy ortam değişkeninden okunur.
const crypto = require('crypto');
module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supplied = String(req.body && req.body.password || '');
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(503).json({ error: 'Admin girişi sunucuda yapılandırılmamış.' });
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Giriş bilgileri doğrulanamadı.' });
  const secret = process.env.ADMIN_TOKEN_SECRET || expected;
  const signature = crypto.createHmac('sha256', secret).update('admin').digest('hex');
  res.status(200).json({ token: signature });
};
