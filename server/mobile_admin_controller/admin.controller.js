import bcrypt from "bcrypt"; // For password hashing
import jwt from "jsonwebtoken";
import Admin from "../mobile_admin_models/admin.model.js";
import dotenv from "dotenv";
dotenv.config();

// Admin Login
export const adminLogin = async (req, res) => {
  console.log("1111111111111111111111111111111111111111");
  console.log("JWT_SECRET:", process.env.JWT_SECRET); // Debug log
  console.log("LOGIN START:");
  console.log("22222222222222222222222222222222222222");
  const { email, password } = req.body;
  if (!email || !password) {
    console.log(email + password);
    return res.json({ success: false, message: "Please fill all fields" });
  }

  try {
    console.log("LOOKING FOR ADMIN...");
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("ADMIN NOT FOUND: " + email);
      return res.json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log("INVALID PASSWORD: " + password);
      return res.json({ success: false, message: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.json({ success: false, message: "JWT_SECRET is not defined" });
    }

    try {
      console.log("GENERATING TOKEN...");
      const token = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: "Admin login successful",
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: "admin",
        },
        token,
      });
    } catch (err) {
      console.error("JWT Error:", err);
      return res.json({
        success: false,
        message: "Error generating JWT: " + err.message,
      });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Admin Data
export const getAdminData = async (req, res) => {
  try {
    const { userId } = req.body;
    const admin = await Admin.findById(userId);

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    res.json({
      success: true,
      userData: {
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Create Admin
export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.json({ success: false, message: "All fields are required" });

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.json({ success: false, message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();

    res.json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
