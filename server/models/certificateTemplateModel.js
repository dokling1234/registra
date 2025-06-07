const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  templateId: { type: String }, // Add this if you want to track template style
  organizers: [{
    name: { type: String },
    label: { type: String },
    signature: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

certificateTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);