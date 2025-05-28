const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel.js");
const transporter = require("../config/nodemailer.js");
const adminModel = require("../models/adminModel.js");
const {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} = require("../config/emailTemplates.js");

// register controller
const register = async (req, res) => {
  const {
    fullName,
    email,
    password,
    contactNumber,
    icpepId,
    userType,
    age,
    membership,
    disabled = false, // default to false if not provided
  } = req.body;

  if (!fullName || !email || !password) {
    return res.json({ success: false, message: "Please fill all the fields" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      fullName,
      email,
      password: hashedPassword,
      contactNumber,
      icpepId,
      userType,
      age: Number(age), // make sure it's a number if your schema expects that
      membership,
      disabled,
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, fullName: user.fullName },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: "Register successful" });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// login controller
const login = async (req, res) => {
  res.clearCookie("token");
  const { email, password, isAdmin } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: "Please fill all the fields" });
  }

  try {
    const account = isAdmin
      ? await adminModel.findOne({ email })
      : await userModel.findOne({ email });

    if (!account) {
      return res.json({ success: false, message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: account._id, fullName: account.fullName, isAdmin },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful auth",
      user: {
        isVerified: account.isVerified,
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        userType: account.userType, // use exact userType from DB
      },
    });
  } catch (error) {
    console.log("Login error:", error);
    return res.json({ success: false, message: error.message });
  }
};
// logout controller
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// Send Verification OTP to the User Email
const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await userModel.findById(userId);
    if (user.isVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.otp = otp;
    user.otpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiration

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify your account",
      // text: `Your OTP is ${otp}. Verify your account using this OTP.`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// Reset password controller
const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const { userId } = req.user;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Please fill all the fields" });
  }
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.otp === "" || user.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.otpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }
    user.isVerified = true;
    user.otp = "";
    user.otpExpireAt = 0;

    await user.save();
    return res.json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// Check if the user authenticated or not
const isAuthenticated = async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({
      success: true,
      message: "User is authenticated",
      userId: decoded.id,
      isAdmin: decoded.isAdmin || false, // <-- send isAdmin back!
    });
  } catch (error) {
    return res.json({ success: false, message: "Invalid or expired token" });
  }
};

// Send Reset Password OTP to the User Email
const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.otp = otp;
    user.otpExpireAt = Date.now() + 15 * 60 * 1000; // 24 hours expiration

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      // text: `Your OTP is ${otp}. Reset your password using this OTP.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{email}}", user.email).replace(
        "{{otp}}",
        otp
      ),
    };
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Reset User Password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({
      success: false,
      message: "Email, OTP, and new password are required",
    });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.otp === "" || user.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.otpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = "";
    user.otpExpireAt = 0;

    await user.save();
    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
};
