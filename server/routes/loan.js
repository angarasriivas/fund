const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/give-loan', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { userId, borrowerName, mobileNumber, guarantorName, guarantorSignature, paymentMode, amount, interestAmount } = req.body;
        if (String(userId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        let calculatedRemaining = amount;
        
        if (interestAmount && interestAmount > 0) {
            calculatedRemaining = amount + interestAmount;
        }

        const loan = await Loan.create({
            userId,
            borrowerName,
            mobileNumber,
            guarantorName,
            guarantorSignature,
            paymentMode,
            amount,
            interestAmount: interestAmount || 0,
            remaining: calculatedRemaining,
            status: 'active'
        });
        res.status(201).json(loan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/repay', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { loanId, amount } = req.body;
        const loan = await Loan.findById(loanId);
        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        
        loan.remaining -= amount;
        if (loan.remaining <= 0) {
            loan.remaining = 0;
            loan.status = 'repaid';
        }
        await loan.save();
        res.status(200).json(loan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:userId', requireAuth, requireRole('admin', 'user'), async (req, res) => {
    try {
        const query = req.user.role === 'admin'
            ? { userId: req.params.userId }
            : {};
        const loans = await Loan.find(query).populate('groupId', 'groupName').sort({ createdAt: -1 });
        res.status(200).json(loans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await Loan.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Loan successfully cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
