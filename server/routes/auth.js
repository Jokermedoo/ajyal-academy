const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const repo = require('../repo');
const { validate, loginSchema } = require('../validation');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const COOKIE = 'ajyal_token';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'محاولات كثيرة، يرجى المحاولة بعد 15 دقيقة' },
});

function sign(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, pv: String(user.password_hash).slice(-12) },
    SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { username, password } = req.body || {};
  const user = await repo.getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  if (user.active === 0) {
    return res.status(403).json({ error: 'هذا الحساب معطّل، تواصل مع مدير الموقع' });
  }
  const token = sign(user);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV==='production', maxAge: 7*24*60*60*1000 });
  repo.touchLogin(user.id).catch(() => {});
  res.json({ ok: true, username: user.username, role: user.role || 'admin' });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

router.get('/session', async (req, res) => {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.json({ authenticated: false });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await repo.getUserById(payload.userId);
    if (!user || user.active === 0) return res.json({ authenticated: false });
    res.json({ authenticated: true, username: user.username, role: user.role || 'admin' });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;