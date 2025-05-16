import mongoose from 'mongoose';
import db from '../config/db.js';

const { Schema } = mongoose;

const registrantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  fullName: { type: String },
  registeredAt: { type: Date, default: Date.now },
  paymentStatus: { type: String, default: "pending" },
  ticketQR: { type: String, default: "" },  // fixed typo: 'defeault' → 'default'
  attended: { type: Boolean, default: false },
  receipt: { type: String },
});

const eventSchema = new Schema({
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
  },
  eventTarget: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere',
  },
  registrations: [registrantSchema],
}, {
  timestamps: true,
});

const eventModel = db.model('event', eventSchema);
export default eventModel;
