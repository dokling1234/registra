const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");
const Event = require("../models/eventModel.js");
const transporter = require("../config/nodemailer"); 
const crypto = require("crypto");

// Admin Login
const adminLogin = async (req, res) => {

  const { email, password, userType } = req.body;

  if (!email || !password || !userType) {
    return res.json({
      success: false,
      message: "Please fill all fields including userType",
    });
  }

  if (userType !== "admin" && userType !== "superadmin") {
    return res.json({
      success: false,
      message: "Invalid userType for this login",
    });
  }

  try {
    const admin = await Admin.findOne({ email, userType });

    if (!admin) {
      return res.json({ success: false, message: `${userType} not found` });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.json({ success: false, message: "JWT_SECRET is not defined" });
    }

    const token = jwt.sign(
      { id: admin._id, userType: admin.userType, fullName: admin.fullName },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: `${userType} login successful`,
      passwordChangeRequired: admin.passwordChangeRequired || false,
      adminId: admin._id,
      user: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        userType: admin.userType,
      },
      token,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Get Admin Data
const getAdminData = async (req, res) => {
  console;
  try {
    const { userId } = req.user || req.body;
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

const createAdmin = async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res.json({
      success: false,
      message: "Full name and email are required.",
    });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
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
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      userType: "admin",
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

const getAllUsers = async (req, res) => {
  try {
    console.log("getallusers");
    const admins = await Admin.find({}); 

    if (admins.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found." });
    }
    console.log("sadsada");
    console.log(admins.length);

    res.json({ success: true, admins, count: admins.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getEvents = async (req, res) => {
  try {
    const { type, location, month, longitude, latitude, maxDistance } =
      req.query;
    const match = {};

    if (type) match.eventType = type;
    if (location) match.location = location;

    const pipeline = [];

    if (longitude && latitude) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: maxDistance ? parseInt(maxDistance) : 10000, // Default 10km
        },
      });
    }

    if (month && month !== "All") {
      pipeline.push({
        $addFields: {
          monthName: {
            $dateToString: { format: "%B", date: "$date" },
          },
        },
      });

      match.monthName = month;
    }

    pipeline.push({ $match: match });

    const events = await Event.aggregate(pipeline);
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registerForEvent = async (req, res) => {
  console.log("Register for event endpoint hit");
  const { id } = req.params;
  const { eventId, userId, email, paymentStatus, ticketQR, receipt, fullName } = req.body;
  console.log(req.body);
  try {
    console.log("eventId:", id);
    const event = await Event.findById(id);
    if (!event) {
      console.log("noott eeeeevvvvvvvvventttttttttttttttttt");

      return res.status(404).json({ message: "Event not found" });
    }

    const registrations = {
      userId,
      registeredAt: new Date(),
      paymentStatus,
      ticketQR,
      fullName,
      receipt,
    };

    console.log("endpoint🚀 Register  hit");
    console.log("Body:", req.body);

    event.registrations.push(registrations);
    await event.save();

    res.status(200).json({ message: "Registration successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const QRchecker = async (req, res) => {
  const { userId } = req.body;
  console.log("QRchecker========================================");
  console.log(userId);
  try {
    const objectId = new mongoose.Types.ObjectId(userId);

    const event = await Event.findOne({ "registrations._id": objectId });
    if (!event) {
      return res
        .status(404)
        .json({ message: "Registration not found in any event" });
    }

    const registration = event.registrations.find(
      (reg) => reg._id.toString() === objectId.toString()
    );
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.attended) {
      return res.status(400).json({ message: "QR code has already been used" });
    }

    registration.attended = true;
    await event.save();

    return res.json({ message: "Attendance updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const pdfCertificate = async (req, res) => {
  console.log("PDF certificate endpoint hit");
  try {
    const filePath = req.file.path;

    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    firstPage.drawText("Generated by Registra", {
      x: 50,
      y: 700,
      size: 24,
      color: rgb(0, 0.53, 0.71),
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(
      "uploads",
      `modified_${req.file.originalname}`
    );
    fs.writeFileSync(outputPath, modifiedPdfBytes);

    res.json({
      success: true,
      message: "PDF modified successfully",
      file: outputPath,
    });
  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({ success: false, error: "Failed to process PDF" });
  }
};

const changeAdminPassword = async (req, res) => {
  const { adminId, newPassword } = req.body;

  if (!adminId || !newPassword) {
    return res.json({ success: false, message: "All fields are required." });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await Admin.findByIdAndUpdate(adminId, {
      password: hashed,
      passwordChangeRequired: false,
    });

    res.json({
      success: true,
      message: "Password updated. You can now log in.",
    });
  } catch (error) {
    res.json({ success: false, message: "Server error: " + error.message });
  }
};

module.exports = {
  adminLogin,
  getAdminData,
  createAdmin,
  getAllUsers,
  getEvents,
  registerForEvent,
  QRchecker,
  pdfCertificate,
  changeAdminPassword,
};
