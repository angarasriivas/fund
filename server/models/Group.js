const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  monthlyAmount: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
