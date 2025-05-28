const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  templateUrl: {
    type: String,
    required: true
  },
  organizers: [{
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    signature: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
certificateTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema); 