const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  icpepId: String,
  passwordChangeRequired: {
    type: Boolean,
    default: false,
  },
  userType: String,
});

module.exports = mongoose.model("Admin", adminSchema);
