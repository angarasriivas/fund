require('dotenv').config();
const mongoose = require('mongoose');

console.log('Attempting to connect to MongoDB...');

if (!process.env.MONGO_URI) {
  console.log('FAILED: MONGO_URI is not set');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('SUCCESS! MongoDB connected.');
    process.exit(0);
  })
  .catch((err) => {
    console.log('FAILED to connect:', err.message);
    process.exit(1);
  });
