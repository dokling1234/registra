const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel.js");
const adminModel = require("../models/adminModel.js");
const UserService = require("../services/user.services.js");
const { otpStorage } = require("../config/emailsender.js");
const { generateOTP, sendOTP, sendResetOTP } = require("../config/emailsender.js");

const MAX_OTP_AGE = 1 * 60 * 1000;

const getUserData = async (req, res) => {
  try {
    const { userId, userType } = req.user;


    let user;

    if (userType === "admin" || userType === "superadmin") {

      user = await adminModel.findById(userId);
    } else {
      user = await userModel.findById(userId);

    }
    // if (!user) {
    //   return res.json({
    //     success: false,
    //     message: "User not found in getUserData",
    //   });
    // }

    res.json({
      success: true,
      userData: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        ...(user.contactNumber && { contactNumber: user.contactNumber }),
        ...(user.icpepId && { icpepId: user.icpepId }),
        ...(user.aboutMe && { aboutMe: user.aboutMe }),
        ...(user.membership && { membership: user.membership }),
        ...(user.profileImage && { profileImage: user.profileImage }),
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}); // Fetch all users from the database

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found." });
    }

    res.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const updateUserData = async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from userAuth middleware
    const { fullName, contactNumber, aboutMe, profileImage } = req.body; // Extract only the fields you want to update

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { fullName, contactNumber, aboutMe, profileImage }, // Only update these fields
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from userAuth middleware
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getAllAdmins = async (req, res) => {
  try {

    const admins = await adminModel.find({}); // Fetch all users from the database

    if (admins.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found." });
    }

    res.json({ success: true, admins, count: admins.length });
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const sendOTPHandler = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: false, message: "Email is required" });
    }

    const user = await UserService.checkuser(email);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User does not exist" });
    }

    const otp = generateOTP();
    otpStorage[email] = { code: otp, timestamp: Date.now() };
    await sendResetOTP(email, otp);

    res.status(200).json({ status: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res
      .status(500)
      .json({ status: false, message: "An error occurred while sending OTP" });
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ status: false, message: "Email and OTP are required" });
    }

    const storedOTP = otpStorage[email];

    if (!storedOTP) {
      return res
        .status(400)
        .json({ status: false, message: "OTP not found or expired" });
    }

    // Support both legacy string OTP and new structured { code, timestamp }
    const isStructured = typeof storedOTP === "object" && storedOTP !== null;
    const code = isStructured ? storedOTP.code : storedOTP;
    const timestamp = isStructured ? storedOTP.timestamp : undefined;
    if (timestamp && Date.now() - timestamp > MAX_OTP_AGE) {
      delete otpStorage[email];
      return res.status(400).json({ status: false, message: "OTP expired" });
    }

    if ((code || "").trim() !== (otp || "").trim()) {
      return res.status(400).json({ status: false, message: "Invalid OTP" });
    }

    delete otpStorage[email];
    await UserService.verifyUser(email, true);

    res
      .status(200)
      .json({ status: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred during OTP verification",
    });
  }
};

const mobileLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    // Try user first
    let user = await UserService.checkuser(email);
    let userType = "user";

    if (!user) {
      // If not found, try admin
      user = await adminModel.findOne({ email });
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "Account does not exist",
        });
      }
      userType = "admin";
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Incorrect password",
      });
    }

    // Create token
    const tokenData = { _id: user._id, email: user.email };
    const token = await UserService.generateToken(tokenData, "secretKey", "1h");

    // Handle admin login logic
    if (userType === "admin") {
      return res.status(200).json({
        _id: user._id,
        status: true,
        token,
        isVerified: true,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType || "admin",
        message: "Admin login successful",
      })
    }

    // Handle normal user login logic
    if (user.isVerified) {
      return res.status(200).json({
        _id: user._id,
        status: true,
        token,
        isVerified: true,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        contactNumber: user.contactNumber,
        icpepId: user.icpepId,
        aboutMe: user.aboutMe,
        profileImage: user.profileImage,
        membership: user.membership,
        message: "Login successful, no OTP required",
      });
    } else {
      const otp = generateOTP();
      otpStorage[email] = { code: otp, timestamp: Date.now() };
      sendOTP(email, otp);

      return res.status(200).json({
        _id: user._id,
        status: true,
        token,
        isVerified: false,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        contactNumber: user.contactNumber,
        icpepId: user.icpepId,
        aboutMe: user.aboutMe,
        profileImage: user.profileImage,
        membership: user.membership,
        message: "OTP sent to your email",
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred during login",
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: false, message: "Email is required" });
    }

    const user = await UserService.checkuser(email);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User does not exist" });
    }

    const otp = generateOTP();
    otpStorage[email] = { code: otp, timestamp: Date.now() };
    await sendResetOTP(email, otp);

    res.status(200).json({ status: true, message: "OTP resent to your email" });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred while resending OTP",
    });
  }
};

const resetverifyOTP = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
    }

    if (!otpStorage[email]) {
      return res.status(400).json({ error: "OTP not found or expired" });
    }

    if (otpStorage[email].trim() !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const user = await UserService.checkuser(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ error: "New password cannot be the same as the old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await UserService.updateUser(email, hashedPassword);

    delete otpStorage[email];
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { email, fullName, contactNumber, aboutMe, profileImage } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName;
    user.contactNumber = contactNumber;
    user.aboutMe = aboutMe;
    user.profileImage = profileImage;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const mobileResetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword, userId } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the new password is the same as the old one
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ error: "New password cannot be the same as the old password" });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password with the hashed password
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ status: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: false, message: "Email is required" });
    }

    const user = await userModel.findOne({ email });
    res.status(200).json({ exists: !!user });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred while checking the email",
    });
  }
};

const mobileRegister = async (req, res, next) => {
  try {
    const {
      fullName,
      contactNumber,
      email,
      password,
      confirmPassword,
      icpepId = "",
      userType,
      membership,
      aboutMe = "",
      profileImage = "default-profile.png",
      disabled = false,
    } = req.body;
    // Check individual fields and return specific errors
    if (!fullName || fullName.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "Full name is required", field: "fullName" });
    }
    if (!email || email.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "Email is required", field: "email" });
    }
    if (!contactNumber || contactNumber.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "Contact number is required", field: "contactNumber" });
    }
    if (!password || password.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "Password is required", field: "password" });
    }
    if (!confirmPassword || confirmPassword.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "Confirm password is required", field: "confirmPassword" });
    }
    if (!userType || userType.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "User type is required", field: "userType" });
    }
    if (!membership || membership.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: "Membership is required", field: "membership" });
    }
    // Check if member has valid ICPEP ID
    if (membership === "member" && (!icpepId || icpepId.trim() === '' || icpepId === 'null' || icpepId === 'undefined')) {
      return res
        .status(400)
        .json({ status: false, message: "ICPEP ID is required for Members", field: "icpepId" });
    }
    if (password.trim() !== confirmPassword.trim()) {
      return res
        .status(400)
        .json({ status: false, message: "Passwords do not match", field: "confirmPassword" });
    }

    if (!["student", "professional"].includes(userType)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid user type", field: "userType" });
    }
    if (!["member", "non-member"].includes(membership)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid membership type", field: "membership" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await UserService.registerUser(
        fullName,
        contactNumber,
        email,
        hashedPassword,
        hashedPassword,
        icpepId,
        userType,
        membership,
        aboutMe,
        profileImage,
        disabled
      );

      res.json({ status: true, success: "User Registered Successfully" });
    } catch (serviceError) {
      console.error("UserService registration error:", serviceError);
      if (serviceError.code === 11000) {
        // Check if it's a duplicate email or icpepId
        if (serviceError.keyPattern && serviceError.keyPattern.email) {
          return res.status(400).json({
            status: false,
            message: "Email already exists",
            field: "email"
          });
        } else if (serviceError.keyPattern && serviceError.keyPattern.icpepId) {
          return res.status(400).json({
            status: false,
            message: "ICPEP ID already exists",
            field: "icpepId"
          });
        } else {
          return res.status(400).json({
            status: false,
            message: "Duplicate entry found",
            field: "general"
          });
        }
      }
      throw serviceError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ status: false, message: "Registration failed--->" });
  }
};

module.exports = {
  getUserData,
  getAllUsers,
  updateUserData,
  resetPassword,
  getAllAdmins,
  sendOTPHandler,
  verifyOTP,
  mobileLogin,
  resendOTP,
  resetverifyOTP,
  updateProfile,
  mobileResetPassword,
  checkEmail,
  mobileRegister,
};