const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/pay', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { userId, groupId, month, amount, paymentMethod } = req.body;
        if (String(userId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const payment = await Payment.create({
            userId,
            groupId,
            month,
            amount,
            status: 'paid',
            paymentMethod: paymentMethod || 'Online'
        });
        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/history/:userId', requireAuth, requireRole('admin', 'user'), async (req, res) => {
    try {
        const query = req.user.role === 'admin'
            ? { userId: req.params.userId }
            : {};
        const payments = await Payment.find(query).populate('groupId', 'groupName');
        res.status(200).json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await Payment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Payment removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
