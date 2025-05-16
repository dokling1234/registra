import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String},
  contactNumber: {type: Number},
  icpepId: {type: String},
  verifyOtp: { type: String, default: "" },
  verifyOtpExpireAt: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: "" },
  resetOtpExpireAt: { type: Number, default: 0 },
  age:{type: Number},
  profileImage:{type: String},
  userType: {
    type: String,
    enum: ['student', 'professional'],
    default: 'student'
  },
  membership: {
    type: String,
    enum: ["member", "non-member"],
    default: "member",
  },
  aboutMe: { type: String, default: "" },
});

const userModel = mongoose.model.user || mongoose.model("User", userSchema);

export default userModel;
