const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { all, get, run } = require('../db');

router.post('/pay', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId, groupId, month, amount, paymentMethod } = req.body;
    if (String(userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const created = await run(
      `INSERT INTO payments (user_id, group_id, month, amount, status, payment_method)
       VALUES (?, ?, ?, ?, 'paid', ?)`,
      [userId, groupId, month, amount, paymentMethod || 'Online']
    );
    const payment = await get('SELECT * FROM payments WHERE id = ?', [created.lastID]);
    res.status(201).json({
      _id: String(payment.id),
      userId: String(payment.user_id),
      groupId: String(payment.group_id),
      month: payment.month,
      amount: Number(payment.amount),
      status: payment.status,
      paymentMethod: payment.payment_method,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/history/:userId', requireAuth, requireRole('admin', 'user'), async (req, res) => {
  try {
    const rows = req.user.role === 'admin'
      ? await all(
        `SELECT p.*, g.group_name
         FROM payments p
         LEFT JOIN groups g ON g.id = p.group_id
         WHERE p.user_id = ?`,
        [req.params.userId]
      )
      : await all(
        `SELECT p.*, g.group_name
         FROM payments p
         LEFT JOIN groups g ON g.id = p.group_id`
      );

    const payments = rows.map((payment) => ({
      _id: String(payment.id),
      userId: String(payment.user_id),
      groupId: payment.group_id
        ? { _id: String(payment.group_id), groupName: payment.group_name }
        : null,
      month: payment.month,
      status: payment.status,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    }));
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Payment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
