const jwt = require('jsonwebtoken');
const repo = require('./repo');
const SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const COOKIE = 'ajyal_token';

async function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await repo.getUserById(payload.userId);
    if (!user) return res.status(401).json({ error: 'غير مصرح' });
    if (user.active === 0) return res.status(401).json({ error: 'الحساب معطّل' });
    // Invalidate tokens issued before the last password change.
    if (!payload.pv || payload.pv !== String(user.password_hash).slice(-12)) {
      return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' });
    }
    req.user = user;
    req.session = { userId: user.id, username: user.username }; // compat
    next();
  } catch {
    return res.status(401).json({ error: 'غير مصرح' });
  }
}
module.exports = { requireAuth };