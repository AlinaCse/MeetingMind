const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: String, required: true },
  owner: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  deadline: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'done', 'overdue'], default: 'pending' },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

actionItemSchema.index({ deadline: 1, status: 1 });
module.exports = mongoose.model('ActionItem', actionItemSchema);
