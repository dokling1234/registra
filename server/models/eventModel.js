const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: "2dsphere",
  },
  status: {
  type: String,
  default: "active"
},
  timestamp: { type: Date, default: Date.now },
  time: { type: String },
  price: { type: Number, min: 0 },
  cost: { type: Number, min: 0, default: 0 },
  about: { type: String },
  hostName: { type: String },
  eventType: { type: String },
  isPastEvent: { type: Boolean, default: false },
  eventTarget: { type: String },
  image: { type: String },
  webinarLink: { type: String },
  
  registrations: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: { type: String },
      userType: { type: String },
      registeredAt: { type: Date, default: Date.now },
      paymentStatus: { type: String, default: "pending" },
      ticketQR: { type: String },
      attended: { type: Boolean, default: false },
      receipt: { type: String },
    },
  ],
  organizers: [
    {
      name: { type: String },
      label: { type: String },
      signature: { type: String }, // URL to signature image
    }
  ],
});

const eventModel = mongoose.model.event || mongoose.model("Event", eventSchema);

module.exports = eventModel;

