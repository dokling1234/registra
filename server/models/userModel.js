const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullName: { type: String, required: true },  // Keep fullName
  firstName: { type: String, required: true }, // New
  middleName: { type: String },               // New, optional
  lastName: { type: String, required: true }, // New
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: { type: String },
  icpepId: { type: String },
  otp: { type: String, default: "" },        // otp
  otpExpireAt: { type: Number, default: 0 }, // otpExpireAt
  isVerified: { type: Boolean, default: false },
  profileImage: { type: String },
  disabled: { type: Boolean, default: false },
  userType: {
    type: String,
    enum: ["student", "professional"],
    default: "student",
  },
  membership: {
    type: String,
    default: "member",
  },
  aboutMe: { type: String, default: "" },
});

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = userModel;
