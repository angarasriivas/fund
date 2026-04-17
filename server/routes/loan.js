const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { all, get, run } = require('../db');

router.post('/give-loan', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId, borrowerName, mobileNumber, guarantorName, guarantorSignature, paymentMode, amount, interestAmount, groupId } = req.body;
    if (String(userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let calculatedRemaining = Number(amount);
    if (interestAmount && Number(interestAmount) > 0) {
      calculatedRemaining = Number(amount) + Number(interestAmount);
    }

    const created = await run(
      `INSERT INTO loans (
        user_id, group_id, borrower_name, mobile_number, guarantor_name,
        guarantor_signature, payment_mode, amount, interest_amount, remaining, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        userId,
        groupId || null,
        borrowerName,
        mobileNumber,
        guarantorName,
        guarantorSignature || '',
        paymentMode,
        amount,
        interestAmount || 0,
        calculatedRemaining,
      ]
    );
    const loan = await get('SELECT * FROM loans WHERE id = ?', [created.lastID]);
    res.status(201).json({
      _id: String(loan.id),
      userId: String(loan.user_id),
      groupId: loan.group_id ? String(loan.group_id) : null,
      borrowerName: loan.borrower_name,
      mobileNumber: loan.mobile_number,
      guarantorName: loan.guarantor_name,
      guarantorSignature: loan.guarantor_signature,
      paymentMode: loan.payment_mode,
      amount: Number(loan.amount),
      interestAmount: Number(loan.interest_amount),
      remaining: Number(loan.remaining),
      status: loan.status,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/repay', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { loanId, amount } = req.body;
    const loan = await get('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    let remaining = Number(loan.remaining) - Number(amount);
    let status = loan.status;
    if (remaining <= 0) {
      remaining = 0;
      status = 'repaid';
    }
    await run(
      `UPDATE loans
       SET remaining = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [remaining, status, loanId]
    );
    const updated = await get('SELECT * FROM loans WHERE id = ?', [loanId]);
    res.status(200).json({
      _id: String(updated.id),
      userId: String(updated.user_id),
      groupId: updated.group_id ? String(updated.group_id) : null,
      borrowerName: updated.borrower_name,
      mobileNumber: updated.mobile_number,
      guarantorName: updated.guarantor_name,
      guarantorSignature: updated.guarantor_signature,
      paymentMode: updated.payment_mode,
      amount: Number(updated.amount),
      interestAmount: Number(updated.interest_amount),
      remaining: Number(updated.remaining),
      status: updated.status,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:userId', requireAuth, requireRole('admin', 'user'), async (req, res) => {
  try {
    const rows = req.user.role === 'admin'
      ? await all(
        `SELECT l.*, g.group_name
         FROM loans l
         LEFT JOIN groups g ON g.id = l.group_id
         WHERE l.user_id = ?
         ORDER BY l.created_at DESC`,
        [req.params.userId]
      )
      : await all(
        `SELECT l.*, g.group_name
         FROM loans l
         LEFT JOIN groups g ON g.id = l.group_id
         ORDER BY l.created_at DESC`
      );

    const loans = rows.map((loan) => ({
      _id: String(loan.id),
      userId: String(loan.user_id),
      groupId: loan.group_id
        ? { _id: String(loan.group_id), groupName: loan.group_name }
        : null,
      borrowerName: loan.borrower_name,
      mobileNumber: loan.mobile_number,
      guarantorName: loan.guarantor_name,
      guarantorSignature: loan.guarantor_signature,
      paymentMode: loan.payment_mode,
      amount: Number(loan.amount),
      interestAmount: Number(loan.interest_amount),
      remaining: Number(loan.remaining),
      status: loan.status,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
    }));
    res.status(200).json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM loans WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Loan successfully cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
