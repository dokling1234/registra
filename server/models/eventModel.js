import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: "2dsphere",
  },
  timestamp: { type: Date, default: Date.now },
  time: { type: String },
  price: { type: Number, min: 0 },
  about: { type: String },
  hostName: { type: String },
  eventType: { type: String },
  isPastEvent: { type: Boolean, default: false },
  eventTarget: { type: String },
  image: { type: String },
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
});
/* creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, */
const eventModel = mongoose.model.event || mongoose.model("Event", eventSchema);

export default eventModel;
