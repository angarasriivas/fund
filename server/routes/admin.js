const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { all, run } = require('../db');
const { logAuditEvent } = require('../utils/audit');

async function getExportPayload() {
  const [users, groups, groupMembers, payments, loans] = await Promise.all([
    all('SELECT id, name, email, password, role, created_at, updated_at FROM users ORDER BY id ASC'),
    all('SELECT * FROM groups ORDER BY id ASC'),
    all('SELECT * FROM group_members ORDER BY group_id ASC, user_id ASC'),
    all('SELECT * FROM payments ORDER BY id ASC'),
    all('SELECT * FROM loans ORDER BY id ASC'),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      groups: groups.length,
      groupMembers: groupMembers.length,
      payments: payments.length,
      loans: loans.length,
    },
    data: {
      users,
      groups,
      groupMembers,
      payments,
      loans,
    },
  };
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
  const groupMembers = Array.isArray(backup?.groupMembers) ? backup.groupMembers : null;
  const payments = Array.isArray(backup?.payments) ? backup.payments : null;
  const loans = Array.isArray(backup?.loans) ? backup.loans : null;

  if (!users || !groups || !groupMembers || !payments || !loans) {
    return res.status(400).json({
      message: 'Invalid backup format. Expected users, groups, groupMembers, payments and loans arrays.',
    });
  }

  try {
    await run('BEGIN TRANSACTION');
    await run('DELETE FROM group_members');
    await run('DELETE FROM loans');
    await run('DELETE FROM payments');
    await run('DELETE FROM groups');
    await run('DELETE FROM users');

    for (const user of users) {
      await run(
        `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          user.password || '',
          user.role || 'user',
          user.created_at || new Date().toISOString(),
          user.updated_at || new Date().toISOString(),
        ]
      );
    }

    for (const group of groups) {
      await run(
        `INSERT INTO groups (id, group_name, admin_id, monthly_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          group.id,
          group.group_name,
          group.admin_id,
          group.monthly_amount,
          group.created_at || new Date().toISOString(),
          group.updated_at || new Date().toISOString(),
        ]
      );
    }

    for (const gm of groupMembers) {
      await run(
        `INSERT INTO group_members (group_id, user_id, created_at)
         VALUES (?, ?, ?)`,
        [gm.group_id, gm.user_id, gm.created_at || new Date().toISOString()]
      );
    }

    for (const payment of payments) {
      await run(
        `INSERT INTO payments (
          id, user_id, group_id, month, status, amount, payment_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payment.id,
          payment.user_id,
          payment.group_id,
          payment.month,
          payment.status || 'not paid',
          payment.amount || 0,
          payment.payment_method || 'Online',
          payment.created_at || new Date().toISOString(),
          payment.updated_at || new Date().toISOString(),
        ]
      );
    }

    for (const loan of loans) {
      await run(
        `INSERT INTO loans (
          id, user_id, group_id, borrower_name, mobile_number, guarantor_name, guarantor_signature,
          payment_mode, amount, interest_amount, remaining, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          loan.id,
          loan.user_id,
          loan.group_id || null,
          loan.borrower_name || 'Unknown Borrower',
          loan.mobile_number || 'N/A',
          loan.guarantor_name || 'None',
          loan.guarantor_signature || '',
          loan.payment_mode || 'Cash',
          loan.amount || 0,
          loan.interest_amount || 0,
          loan.remaining || 0,
          loan.status || 'active',
          loan.created_at || new Date().toISOString(),
          loan.updated_at || new Date().toISOString(),
        ]
      );
    }

    await run('COMMIT');
    await logAuditEvent(req, {
      action: 'admin_import_restore',
      resource: 'backup',
      details: {
        users: users.length,
        groups: groups.length,
        groupMembers: groupMembers.length,
        payments: payments.length,
        loans: loans.length,
      },
    });
    return res.status(200).json({
      message: 'Backup imported successfully.',
      counts: {
        users: users.length,
        groups: groups.length,
        groupMembers: groupMembers.length,
        payments: payments.length,
        loans: loans.length,
      },
    });
  } catch (err) {
    try {
      await run('ROLLBACK');
    } catch {
      // Ignore rollback errors; primary error is returned.
    }
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
