const jwt = require('jsonwebtoken');

function getTokenFromRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ message: 'Missing auth token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretfundflowkey');
    req.user = decoded; // { email, id, name, role, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Missing auth context' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

module.exports = { requireAuth, requireRole };

