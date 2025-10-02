const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String }, //remove
  contactNumber: { type: String },
  icpepId: { type: String },
  otp: { type: String, default: "" },//otp
  otpExpireAt: { type: Number, default: 0 },//otpExpireAt
  //isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  //resetOtp: { type: String, default: "" },
  //resetOtpExpireAt: { type: Number, default: 0 },
  age: { type: Number }, //remove
  profileImage: { type: String },
  disabled: { type: Boolean },
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

const userModel = mongoose.model.user || mongoose.model("User", userSchema);

// export default userModel;
module.exports = userModel;
