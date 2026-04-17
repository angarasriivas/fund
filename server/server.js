require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/group');
const paymentRoutes = require('./routes/payment');
const loanRoutes = require('./routes/loan');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

function normalizeOrigin(origin) {
  // Normalize to reduce mismatches like trailing slashes.
  return String(origin || '')
    .trim()
    .replace(/\/$/, '');
}

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)
  .filter((origin) => {
    // Prevent placeholder values in production from breaking CORS.
    // Example from server/.env.example: https://your-frontend-domain.vercel.app
    if (/your-frontend-domain/i.test(origin)) return false;
    if (origin.includes('<') || origin.includes('>')) return false;
    return true;
  });

const allowedOriginHosts = allowedOrigins.map((origin) => {
  try {
    return new URL(origin).host;
  } catch {
    // If CORS_ORIGIN was configured as a bare host (no scheme), fall back.
    return normalizeOrigin(origin);
  }
});

// Hardcoded fallback for the currently deployed frontend.
// If you deploy a different frontend domain, prefer configuring `CORS_ORIGIN` instead.
const fallbackAllowedOriginHosts = ['fund-self.vercel.app'];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients or server-to-server calls.
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);

      try {
        const originHost = new URL(origin).host;
        if (fallbackAllowedOriginHosts.includes(originHost)) return callback(null, true);
      } catch {
        // Ignore parse errors and fall through.
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Also allow if configured allowlist matches hostname only.
      // This avoids mismatches when `CORS_ORIGIN` is stored with/without scheme.
      try {
        const originHost = new URL(origin).host;
        if (allowedOriginHosts.includes(originHost)) return callback(null, true);
      } catch {
        // Ignore parse errors and fall through to "not allowed".
      }

      // Do not throw; it can result in 500 responses without CORS headers.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('FundFlow API is running');
});

app.get('/health', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    // 1 = connected
    if (state !== 1) return res.status(500).json({ status: 'error', db: 'disconnected' });
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const existingAdmin = await User.findOne({ email: 'admin@fundflow.com' });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('Admin@123', 12);
      await User.create({
        name: 'FundFlow Admin',
        email: 'admin@fundflow.com',
        password: adminPassword,
        role: 'admin',
      });
      console.log('Default admin created: admin@fundflow.com / Admin@123');
    }

    const existingUser = await User.findOne({ email: 'user@fundflow.com' });
    if (!existingUser) {
      const userPassword = await bcrypt.hash('User@123', 12);
      await User.create({
        name: 'FundFlow User',
        email: 'user@fundflow.com',
        password: userPassword,
        role: 'user',
      });
      console.log('Default user created: user@fundflow.com / User@123');
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Server startup error:', err.message);
    process.exit(1);
  }
}

startServer();
