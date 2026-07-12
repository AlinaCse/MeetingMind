const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  rawNotes: { type: String, required: true },
  decisions: [String],
  unresolved: [String],
  nextMeeting: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
