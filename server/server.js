require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/group');
const paymentRoutes = require('./routes/payment');
const loanRoutes = require('./routes/loan');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients or server-to-server calls.
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked for this origin'));
    },
    credentials: true,
  })
);

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected to FundFlow database")).catch((err) => console.log("MongoDB connection error:", err));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/loans', loanRoutes);

app.get('/', (req, res) => {
  res.send('FundFlow API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
