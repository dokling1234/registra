const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  userType: String,
});

module.exports = mongoose.model("Admin", adminSchema);
