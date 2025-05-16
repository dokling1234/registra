import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

// Admin Login
export const adminLogin = async (req, res) => {
  console.log("Admin login request admin=============================="); // Debugging
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: "Please fill all fields" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: admin._id, userType: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Admin login successful admin",
      user: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        userType: "admin",
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Admin Data
export const getAdminData = async (req, res) => {
  console
  try {
    const { userId } = req.user;
    const admin = await Admin.findById(userId);

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    res.json({
      success: true,
      userData: {
        fullName: admin.fullName,
        email: admin.email,
        userType: "admin",
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const createAdmin = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password)
    return res.json({ success: false, message: "All fields are required" });

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.json({ success: false, message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ fullName, email, password: hashedPassword });
    await newAdmin.save();

    res.json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    console.log("get all users admin..."); // Debugging
    const admins = await Admin.find({});  // Fetch all users from the database

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "No users found." });
    }

    res.json({ success: true, users, count: users.length }); 
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};