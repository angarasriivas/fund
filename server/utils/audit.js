const { run } = require('../db');

async function logAuditEvent(req, { action, resource, details }) {
  const actorUserId = req?.user?.id ? String(req.user.id) : null;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
  const userAgent = req.headers['user-agent'] || null;
  const safeDetails = details ? JSON.stringify(details) : null;

  await run(
    `INSERT INTO audit_logs (actor_user_id, action, resource, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [actorUserId, action, resource, safeDetails, ipAddress, userAgent]
  );
}

module.exports = { logAuditEvent };
