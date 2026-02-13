const authMiddleware = require('./auth');

// Comma-separated list of admin emails in .env e.g. ADMIN_EMAILS=admin@example.com,amit@softude.com
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const adminAuth = async (req, res, next) => {
  await authMiddleware(req, res, () => {
    if (!adminEmails.length) {
      return res.status(503).json({ error: 'Admin access not configured' });
    }
    const email = (req.user?.email || '').toLowerCase();
    if (!adminEmails.includes(email)) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    next();
  });
};

module.exports = adminAuth;
