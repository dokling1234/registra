// controllers/superadminController.js

const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel.js");
const userModel = require("../models/userModel.js");
const eventModel = require("../models/eventModel.js");
const jwt = require("jsonwebtoken");
const transporter = require("../config/nodemailer"); // Adjust path if needed

const crypto = require ("crypto")

const createSuperAdmin = async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res.json({
      success: false,
      message: "Full name and email are required.",
    });
  }

  try {
    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.json({ success: false, message: "Admin already exists." });
    }

    // Generate random password
    const plainPassword = crypto
      .randomBytes(6)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create new admin with passwordChangeRequired flag
    const newAdmin = new adminModel({
      fullName,
      email,
      password: hashedPassword,
      userType: "superadmin",
      passwordChangeRequired: true, // Add this flag in your model
    });

    await newAdmin.save();

    // Send email with credentials
    const mailOptions = {
      from: `"Registra System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Admin Account Credentials",
      text: `Hello ${fullName},\n\nAn admin account has been created for you on the Registra platform.\n\nYour login credentials are:\nEmail: ${email}\nPassword: ${plainPassword}\n\nPlease log in and change your password immediately.\n\nRegards,\nRegistra Team`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Admin created and credentials sent via email.",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.json({ success: false, message: "Server error: " + error.message });
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

const updateAdminOrSuperadmin = async (req, res) => {
  console.log("Update Admin/Superadmin Request:");
  try {
    const { id } = req.params;
    const updateData = req.body; // Contains fields to update, including userType, disabled, etc.
console.log(req.body);
    // Use your admin model here, e.g., adminModel
    const updatedAdmin = await adminModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin/Superadmin not found" });
    }

    res.json({
      success: true,
      message: "Admin/Superadmin updated successfully",
      user: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating admin/superadmin",
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
module.exports = { createSuperAdmin, enableUser, disableUser, updateUser, cancelEvent, updateAdminOrSuperadmin };
