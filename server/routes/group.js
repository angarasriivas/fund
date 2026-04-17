const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { all, get, run } = require('../db');

function mapGroupRow(row, members = []) {
  return {
    _id: String(row.id),
    groupName: row.group_name,
    admin: String(row.admin_id),
    members,
    monthlyAmount: Number(row.monthly_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.post('/create-group', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { groupName, adminId, monthlyAmount } = req.body;
    if (String(adminId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const created = await run(
      'INSERT INTO groups (group_name, admin_id, monthly_amount) VALUES (?, ?, ?)',
      [groupName, adminId, monthlyAmount]
    );
    await run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [created.lastID, adminId]);
    const groupRow = await get('SELECT * FROM groups WHERE id = ?', [created.lastID]);
    const newGroup = mapGroupRow(groupRow, [String(adminId)]);
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add-member', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const groupRow = await get('SELECT * FROM groups WHERE id = ?', [groupId]);
    if (!groupRow) return res.status(404).json({ message: 'Group not found' });

    const members = await all('SELECT user_id FROM group_members WHERE group_id = ?', [groupId]);
    const memberIds = members.map((m) => String(m.user_id));

    if (!memberIds.includes(String(userId))) {
      if (memberIds.length >= 18) {
        return res.status(400).json({ message: 'Group is full (max 18 members)' });
      }
      await run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);
      memberIds.push(String(userId));
    }

    res.status(200).json(mapGroupRow(groupRow, memberIds));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/:userId', requireAuth, requireRole('admin', 'user'), async (req, res) => {
  try {
    let groupRows = [];
    if (req.user.role === 'admin') {
      groupRows = await all(
        `SELECT g.* FROM groups g
         INNER JOIN group_members gm ON gm.group_id = g.id
         WHERE gm.user_id = ?`,
        [req.params.userId]
      );
    } else {
      groupRows = await all('SELECT * FROM groups');
    }

    const groups = await Promise.all(
      groupRows.map(async (row) => {
        const members = await all(
          `SELECT u.id, u.name, u.email
           FROM group_members gm
           INNER JOIN users u ON u.id = gm.user_id
           WHERE gm.group_id = ?`,
          [row.id]
        );
        return {
          _id: String(row.id),
          groupName: row.group_name,
          admin: String(row.admin_id),
          members: members.map((m) => ({
            _id: String(m.id),
            name: m.name,
            email: m.email,
          })),
          monthlyAmount: Number(row.monthly_amount),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      })
    );

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM group_members WHERE group_id = ?', [req.params.id]);
    await run('DELETE FROM groups WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Contributor removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
