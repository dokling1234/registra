import mongoose from 'mongoose';
import db from '../config/db.js';

const registrantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registeredAt: { type: Date, default: Date.now },
  paymentStatus: { type: String, default: 'pending' },
  ticketQR: { type: String },
  attended: { type: Boolean },
  _id: { type: mongoose.Schema.Types.ObjectId },
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  hostName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  isPastEvent: {
    type: Boolean,
    default: false,
  },
  eventType: {
    type: String,
    enum: ['Seminar', 'Activity', 'Workshop', 'Webinar'],
    required: true,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere',
    required: true,
  },
  registrations: [registrantSchema],
}, {
  timestamps: true,
});

const Event = db.model('event', eventSchema);
export default Event;
