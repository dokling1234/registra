// controllers/superadminController.js

const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel.js");
const userModel = require("../models/userModel.js");
const eventModel = require("../models/eventModel.js");
const jwt = require("jsonwebtoken");
const transporter = require("../config/nodemailer"); // Adjust path if needed

const crypto = require ("crypto")
const { logActivity } = require("../services/activityLogService.js");

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

    // Create new admin
    const newAdmin = new adminModel({
      fullName,
      email,
      password: hashedPassword,
      userType: "superadmin",
      passwordChangeRequired: true,
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

    await logActivity(req, {
      action: "create_superadmin",
      targetType: "admin",
      targetId: newAdmin._id,
      metadata: { email, fullName },
    });

    // ✅ Return full admin object
    res.json({
      success: true,
      message: "Admin created and credentials sent via email.",
      user: {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        icpepId: newAdmin.icpepId || "",
        passwordChangeRequired: newAdmin.passwordChangeRequired,
        userType: newAdmin.userType,
      },
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
    await logActivity(req, { action: "enable_user", targetType: "user", targetId: req.params.id });
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
    await logActivity(req, { action: "disable_user", targetType: "user", targetId: req.params.id });
    res.json({ message: "User disabled successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error disabling user", error });
  }
};

const updateUser = async (req, res) => {
  console.log("ewan")
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

    await logActivity(req, { action: "update_user", targetType: "user", targetId: id, metadata: updateData });

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
  console.log("ewan admin")
  try {
    const { id } = req.params;
    const updateData = req.body; // Contains fields to update, including userType, disabled, etc.
    // Use your admin model here, e.g., adminModel
    const updatedAdmin = await adminModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin/Superadmin not found" });
    }

    await logActivity(req, { action: "update_admin", targetType: "admin", targetId: id, metadata: updateData });

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

    await logActivity(req, { action: "cancel_event", targetType: "event", targetId: eventId });

    res.json({ success: true, message: "Event cancelled successfully" });
  } catch (err) {
    console.error("Cancel event error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const uncancelEventController = async (req, res) => {
  const { eventId } = req.params;
  try {
    const event = await eventModel.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    event.status = "active"; // assuming you set status = "cancelled" on cancel
    await event.save();

    return res.json({ success: true, message: "Event reactivated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createSuperAdmin, enableUser, disableUser, updateUser, cancelEvent, updateAdminOrSuperadmin, uncancelEventController, };
