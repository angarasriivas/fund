const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    await run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')`,
      [name, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ message: 'Backend Error: ' + error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { email: user.email, id: String(user.id), name: user.name, role: user.role },
      process.env.JWT_SECRET || 'supersecretfundflowkey',
      { expiresIn: '1h' }
    );

    const userObj = {
      _id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    res.status(200).json({ result: userObj, token });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ message: 'Backend Error: ' + error.message });
  }
});

module.exports = router;
