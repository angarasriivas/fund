const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashedPassword, role: 'user' });
    
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ email: user.email, id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'supersecretfundflowkey', { expiresIn: '1h' });

    const userObj = user.toObject();
    delete userObj.password;
    res.status(200).json({ result: userObj, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
