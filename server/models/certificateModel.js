const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificateUrl: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one certificate per user per event
certificateSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate; 