import UserService from "../services/user.services.js";
import { generateOTP, sendOTP } from "../config/emailsender.js";
import bcrypt from "bcrypt";
import userModel from "../mobile_models/user.model.js";

const MAX_OTP_AGE = 1 * 60 * 1000;
import { otpStorage } from "../config/emailsender.js";
export const register = async (req, res, next) => {
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
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }
    if (membership === "member" && !icpepId) {
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
      return res
        .status(400)
        .json({
          status: false,
          message: "Age must be a number between 10 and 99",
        });
    }
    if (!["student", "professional"].includes(userType)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid user type" });
    }
    if (!["member", "non-member"].includes(membership)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid membership type" });
    }

    await UserService.registerUser(
      fullName,
      contactNumber,
      email,
      password,
      confirmPassword,
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

export const checkuser = async (email) => {
  return await userModel.findOne({ email });
};

export const login = async (req, res, next) => {
  try {
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

export const verifyOTP = async (req, res, next) => {
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
    res
      .status(500)
      .json({
        status: false,
        message: "An error occurred during OTP verification",
      });
  }
};

export const verifyUser = async (email, isVerified) => {
  try {
    await userModel.findOneAndUpdate({ email }, { isVerified });
    console.log(`User ${email} is now verified.`);
  } catch (error) {
    console.error("Error updating user verification:", error);
    throw error;
  }
};

export const sendOTPHandler = async (req, res, next) => {
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

export const resetverifyOTP = async (req, res, next) => {
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

export const updateProfile = async (req, res) => {
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

export const resetPassword = async (req, res, next) => {
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

export const resendOTP = async (req, res) => {
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
    res
      .status(500)
      .json({
        status: false,
        message: "An error occurred while resending OTP",
      });
  }
};

export const checkEmail = async (req, res) => {
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
    res
      .status(500)
      .json({
        status: false,
        message: "An error occurred while checking the email",
      });
  }
};
