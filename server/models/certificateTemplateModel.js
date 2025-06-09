const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  organizers: [{
    name: { type: String },
    label: { type: String },
    signature: { type: String }
  }],

    templates: [
    {
      templateId: { type: String }, 
      url: { type: String },       
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

certificateTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);