// controllers/superadminController.js

const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel.js");
const userModel = require("../models/userModel.js");
const eventModel = require("../models/eventModel.js");
const jwt = require("jsonwebtoken");

const registerSuperadmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if email already exists
    const existing = await adminModel.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create superadmin account
    const newSuperadmin = new adminModel({
      fullName,
      email,
      password: hashedPassword,
      userType: "superadmin", // ✅ Important
    });

    await newSuperadmin.save();

    res.status(201).json({
      success: true,
      message: "Superadmin registered successfully.",
      user: {
        id: newSuperadmin._id,
        email: newSuperadmin.email,
        userType: newSuperadmin.userType,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const enableUser = async (req, res) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { disabled: false },
      { new: true }
    );
    res.json({ message: "User enabled successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error enabling user", error });
  }
};

const disableUser = async (req, res) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { disabled: true },
      { new: true }
    );
    res.json({ message: "User disabled successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error disabling user", error });
  }
};

const updateUser = async (req, res) => {
  console.log("Update User Request:");
  try {
    const { id } = req.params;
    const updateData = req.body; // Contains any fields to update, including disabled

    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
  }
};

const cancelEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await eventModel.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    event.status = "cancelled";
    await event.save();

    res.json({ success: true, message: "Event cancelled successfully" });
  } catch (err) {
    console.error("Cancel event error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = { registerSuperadmin, enableUser, disableUser, updateUser, cancelEvent };
