const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel.js");
const adminModel = require("../models/adminModel.js");
const UserService = require("../services/user.services.js");
const { otpStorage } = require("../config/emailsender.js");
const { generateOTP, sendOTP } = require("../config/emailsender.js");

const MAX_OTP_AGE = 1 * 60 * 1000;

const getUserData = async (req, res) => {
  try {
    const { userId, name } = req.user; // get userId from request body

    const user = await userModel.findById(userId); // find user by userId
    if (!user) {
      return res.json({
        success: false,
        message: "User not found getuserdata usercont",
      });
    }

    res.json({
      success: true,
      userData: {
        id: user._id,
        fullName: user.fullName,
        isVerified: user.isVerified,
        userType: user.userType,
        email: user.email,
        contactNumber: user.contactNumber,
        icpepId: user.icpepId,
        aboutMe: user.aboutMe,
        membership: user.membership,
        profileImage: user.profileImage,
      },
    }); // send user data in response
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
const getAllUsers = async (req, res) => {
  try {
    console.log("usercontroller getallusers..."); // Debugging
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
    console.log("usercontroller getalladmins..."); // Debugging

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
    await sendOTP(email, otp);

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

    const { code, timestamp } = storedOTP;
    if (Date.now() - timestamp > MAX_OTP_AGE) {
      delete otpStorage[email];
      return res.status(400).json({ status: false, message: "OTP expired" });
    }

    if (code !== otp) {
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
    console.log("mobileLogin request body"); // Debugging
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "Email and password are required" });
    }
    const user = await UserService.checkuser(email);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Incorrect password" });
    }
    let tokenData = { _id: user._id, email: user.email };
    const token = await UserService.generateToken(tokenData, "secretKey", "1h");
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
    res
      .status(500)
      .json({ status: false, message: "An error occurred during login" });
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
    await sendOTP(email, otp);

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

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ error: "New password cannot be the same as the old password" });
    }

    user.password = password;
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
  console.log("ssssssssssssssssssssssssssss");
  try {
    const {
      fullName,
      contactNumber,
      email,
      password,
      confirmPassword,
      icpepId,
      age,
      userType,
      membership,
      aboutMe = "",
      profileImage = "default-profile.png",
    } = req.body;
    console.log("mobileRegister", req.body);
    if (
      !fullName ||
      !contactNumber ||
      !email ||
      !password ||
      !confirmPassword ||
      !age ||
      !userType ||
      !membership
    ) {
      console.log("_____________________all fields");
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }
    if (membership === "member" && !icpepId) {
      console.log("_____________________membership");
      return res
        .status(400)
        .json({ status: false, message: "ICPEP ID is required for Members" });
    }
    if (password.trim() !== confirmPassword.trim()) {
      return res
        .status(400)
        .json({ status: false, message: "Passwords do not match" });
    }
    if (isNaN(age) || age < 10 || age > 99) {
      return res.status(400).json({
        status: false,
        message: "Age must be a number between 10 and 99",
      });
    }
    if (!["student", "professional"].includes(userType)) {
      console.log("_____________________userType");
      return res
        .status(400)
        .json({ status: false, message: "Invalid user type" });
    }
    if (!["member", "non-member"].includes(membership)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid membership type" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await UserService.registerUser(
      fullName,
      contactNumber,
      email,
      hashedPassword,
      hashedPassword,
      icpepId,
      age,
      userType,
      membership,
      aboutMe,
      profileImage
    );

    res.json({ status: true, success: "User Registered Successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ status: false, message: "Registration failed" });
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
