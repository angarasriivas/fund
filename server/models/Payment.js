const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  month: { type: String, required: true },
  status: { type: String, enum: ['paid', 'not paid'], default: 'not paid' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, default: 'Online' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
