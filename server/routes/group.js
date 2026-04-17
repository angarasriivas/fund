const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/create-group', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { groupName, adminId, monthlyAmount } = req.body;
    if (String(adminId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const newGroup = await Group.create({
      groupName,
      admin: adminId,
      members: [adminId],
      monthlyAmount,
    });
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add-member', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(userId)) {
      if (group.members.length >= 18) {
        return res.status(400).json({ message: 'Group is full (max 18 members)' });
      }
      group.members.push(userId);
      await group.save();
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/:userId', requireAuth, requireRole('admin', 'user'), async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { members: req.params.userId }
      : {};
    const groups = await Group.find(query).populate('members', 'name email');
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Contributor removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
