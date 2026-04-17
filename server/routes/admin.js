const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Group = require('../models/Group');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const AuditLog = require('../models/AuditLog');

async function getExportPayload() {
  const [users, groups, payments, loans] = await Promise.all([
    User.find({}).lean(),
    Group.find({}).lean(),
    Payment.find({}).lean(),
    Loan.find({}).lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      groups: groups.length,
      payments: payments.length,
      loans: loans.length,
    },
    data: {
      users,
      groups,
      payments,
      loans,
    },
  };
}

async function logAuditEvent(req, { action, resource, details }) {
  try {
    await AuditLog.create({
      actorUserId: req?.user?.id,
      action,
      resource,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });
  } catch {
    // Audit logging should never break the request
  }
}

router.get('/export', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const payload = await getExportPayload();
    await logAuditEvent(req, {
      action: 'admin_export_json',
      resource: 'backup',
      details: payload.counts,
    });
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/export/download', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const payload = await getExportPayload();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fundflow-backup-${stamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await logAuditEvent(req, {
      action: 'admin_export_download',
      resource: 'backup',
      details: { filename, ...payload.counts },
    });
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/import', requireAuth, requireRole('admin'), async (req, res) => {
  const expectedSecret = process.env.ADMIN_IMPORT_SECRET;
  if (expectedSecret) {
    const providedSecret = req.headers['x-admin-import-secret'];
    if (providedSecret !== expectedSecret) {
      return res.status(403).json({ message: 'Invalid import secret' });
    }
  }

  const backup = req.body && req.body.data ? req.body.data : req.body;
  const users = Array.isArray(backup?.users) ? backup.users : null;
  const groups = Array.isArray(backup?.groups) ? backup.groups : null;
  const payments = Array.isArray(backup?.payments) ? backup.payments : null;
  const loans = Array.isArray(backup?.loans) ? backup.loans : null;

  if (!users || !groups || !payments || !loans) {
    return res.status(400).json({
      message: 'Invalid backup format. Expected users, groups, payments and loans arrays.',
    });
  }

  try {
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Payment.deleteMany({}),
      Loan.deleteMany({}),
    ]);

    // Insert in order to satisfy references (users -> groups -> payments/loans)
    await User.insertMany(users, { ordered: false });
    await Group.insertMany(groups, { ordered: false });
    await Payment.insertMany(payments, { ordered: false });
    await Loan.insertMany(loans, { ordered: false });

    await logAuditEvent(req, {
      action: 'admin_import_restore',
      resource: 'backup',
      details: {
        users: users.length,
        groups: groups.length,
        payments: payments.length,
        loans: loans.length,
      },
    });
    return res.status(200).json({
      message: 'Backup imported successfully.',
      counts: {
        users: users.length,
        groups: groups.length,
        payments: payments.length,
        loans: loans.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
