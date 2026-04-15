const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  borrowerName: { type: String, required: true, default: 'Unknown Borrower' },
  mobileNumber: { type: String, required: true, default: 'N/A' },
  guarantorName: { type: String, default: 'None' },
  guarantorSignature: { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },
  amount: { type: Number, required: true },
  interestAmount: { type: Number, default: 0 },
  remaining: { type: Number, required: true },
  status: { type: String, enum: ['active', 'repaid'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
