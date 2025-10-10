const PDFDocument = require("pdfkit");
const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");
const Event = require("../models/eventModel.js");
const transporter = require("../config/nodemailer");
mongoose = require("mongoose");
const crypto = require("crypto");
const { logActivity } = require("../services/activityLogService.js");

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
      await logActivity(req, {
        action: "login_failed",
        metadata: { email, userType },
      });
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

    await logActivity(req, {
      action: "login_success",
      targetType: "admin",
      targetId: admin._id,
      metadata: { email, userType },
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

    await logActivity(req, {
      action: "get_admin_data",
      targetType: "admin",
      targetId: admin._id,
    });

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

    // Create new admin
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      userType: "admin",
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
      action: "create_admin",
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

const getAllUsers = async (req, res) => {
  try {
    const admins = await Admin.find({});

    if (admins.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found." });
    }

    await logActivity(req, {
      action: "list_admins",
      targetType: "admin",
      metadata: { count: admins.length },
    });

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
    await logActivity(req, {
      action: "list_events",
      targetType: "event",
      metadata: { count: events.length },
    });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registerForEvent = async (req, res) => {
  const { id } = req.params; // Event ID
  const { userId, email, paymentStatus, ticketQR, receipt, fullName } =
    req.body;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ✅ Check if user already registered
    const existingReg = event.registrations.find(
      (reg) => reg.userId.toString() === userId.toString()
    );

    if (existingReg) {
      // ✅ If user exists — just update receipt & reset payment status
      existingReg.receipt = receipt || existingReg.receipt;
      existingReg.paymentStatus = "pending"; // Set for re-evaluation
      existingReg.ticketQR = ticketQR || existingReg.ticketQR;

      await event.save();

      return res.status(200).json({
        message: "Receipt re-uploaded. Awaiting approval.",
      });
    }

    // ✅ If user is NOT registered — proceed as NEW registration
    const newRegistration = {
      userId,
      registeredAt: new Date(),
      paymentStatus,
      ticketQR,
      fullName,
      receipt,
    };

    event.registrations.push(newRegistration);
    await event.save();

    await logActivity(req, {
      action: "register_for_event",
      targetType: "event",
      targetId: id,
      metadata: { userId, email, paymentStatus },
    });

    return res.status(200).json({ message: "Registration successful!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const QRchecker = async (req, res) => {
  const { userId } = req.body;

  try {
    const objectId = new mongoose.Types.ObjectId(userId);

    const event = await Event.findOne({ "registrations._id": objectId });
    if (!event) {
      return res
        .status(404)
        .json({ message: "Registration not found in any event" });
    }

    // Check if event is past
    const currentDate = new Date();
    const eventDate = new Date(event.date);
    const isPastEvent = eventDate < currentDate;

    if (isPastEvent) {
      return res.status(400).json({
        message:
          "Event has already ended. Cannot mark attendance for past events.",
      });
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

    await logActivity(req, {
      action: "attendance_update",
      targetType: "event_registration",
      targetId: objectId,
      metadata: { eventId: event._id },
    });

    return res.json({ message: "Attendance updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const pdfCertificate = async (req, res) => {
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

    await logActivity(req, {
      action: "upload_certificate_template",
      targetType: "certificate_template",
      metadata: { originalName: req.file.originalname, outputPath },
    });

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

    await logActivity(req, {
      action: "change_password",
      targetType: "admin",
      targetId: adminId,
    });

    res.json({
      success: true,
      message: "Password updated. You can now log in.",
    });
  } catch (error) {
    res.json({ success: false, message: "Server error: " + error.message });
  }
};

// --- Event Analytics ---
const getEventAnalyticsReport = async (req, res) => {
  try {
    console.log("getventanalyticreport");
    const { id } = req.params;
    // 1. Attendance vs No-shows
    const attendanceStats = await Event.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: "$registrations" },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          date: { $first: "$date" },
          eventType: { $first: "$eventType" },
          totalRegistered: { $sum: 1 },
          attended: { $sum: { $cond: ["$registrations.attended", 1, 0] } },
        },
      },
      {
        $addFields: {
          noShow: { $subtract: ["$totalRegistered", "$attended"] },
          attendanceRate: {
            $cond: [
              { $eq: ["$totalRegistered", 0] },
              0,
              { $divide: ["$attended", "$totalRegistered"] },
            ],
          },
        },
      },
    ]);

    if (!attendanceStats.length) {
      return res.status(404).json({ message: "No data for this event" });
    }

    const stats = attendanceStats[0];

    // 2. Participant breakdown
    const participantBreakdown = await Event.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: "$registrations" },
      {
        $lookup: {
          from: "users",
          localField: "registrations.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: { "user.userType": { $in: ["student", "professional"] } },
      },
      {
        $group: { _id: "$user.userType", count: { $sum: 1 } },
      },
    ]);

    // ----------------------------
    // Build HTML (with charts via Chart.js CDN)
    // ----------------------------
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Event Report</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2 { text-align: center; }
            .chart-container { width: 300px; margin: 20px auto; }
            .summary { margin: 20px auto; max-width: 500px; }
          </style>
        </head>
        <body>
          <h1>📊 Event Analytics Report</h1>
          <h2>${stats.title}</h2>
          <p style="text-align:center;">Date: ${new Date(
            stats.date
          ).toLocaleDateString()}<br/>
          Type: ${stats.eventType}</p>

          <div class="summary">
            <p><b>Total Registered:</b> ${stats.totalRegistered}</p>
            <p><b>Attended:</b> ${stats.attended}</p>
            <p><b>No-shows:</b> ${stats.noShow}</p>
            <p><b>Attendance Rate:</b> ${(stats.attendanceRate * 100).toFixed(
              1
            )}%</p>
          </div>

          <div class="chart-container">
            <canvas id="attendanceChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="participantChart"></canvas>
          </div>

          <script>
            // Attendance Chart
            new Chart(document.getElementById('attendanceChart'), {
              type: 'pie',
              data: {
                labels: ['Attended', 'No-show'],
                datasets: [{
                  data: [${stats.attended}, ${stats.noShow}],
                  backgroundColor: ['#36A2EB', '#FF6384']
                }]
              }
            });

            // Participant Breakdown
            new Chart(document.getElementById('participantChart'), {
              type: 'pie',
              data: {
                labels: ${JSON.stringify(
                  participantBreakdown.map((p) => p._id)
                )},
                datasets: [{
                  data: ${JSON.stringify(
                    participantBreakdown.map((p) => p.count)
                  )},
                  backgroundColor: ['#4CAF50', '#FF9800']
                }]
              }
            });
          </script>
        </body>
      </html>
    `;

    // ----------------------------
    // Generate PDF with Puppeteer
    // ----------------------------
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", bottom: "40px", left: "30px", right: "30px" },
    });
    await browser.close();

    // ----------------------------
    // Send as response
    // ----------------------------
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=event-report-${stats.title}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Analytics report error:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

const samplePdf = async (req, res) => {
  try {
    // 1. Minimal HTML content
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Sample PDF</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
            h1 { color: #36A2EB; }
          </style>
        </head>
        <body>
          <h1>📄 Sample PDF</h1>
          <p>This is a test PDF generated with Puppeteer.</p>
        </body>
      </html>
    `;

    // 2. Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", bottom: "40px", left: "30px", right: "30px" },
    });
    await browser.close();

    // 3. Send PDF buffer
    res.setHeader("Content-Disposition", "attachment; filename=sample.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
};

const getFeedbackQuestionReport = async (req, res) => {
  try {
    const { id, qIndex } = req.params;
    const {
      eventTitle = "Event",
      questionTitle = `Question ${parseInt(qIndex, 10) + 1}`,
      questionType = "Choice",
      labels = [],
      data = [],
      totalResponses = 0,
      responses = [],
    } = req.body || {};

    const safeTitle = String(eventTitle)
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Feedback Question Report</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin: 0 0 4px; text-align: center; }
            h2 { font-size: 16px; margin: 0 0 16px; text-align: center; color: #6B7280; }
            .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 12px 0; }
            .row { display: flex; gap: 12px; }
            .col { flex: 1; }
            .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
            .pill { border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 6px; padding: 8px; }
            .pill-title { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: .05em; }
            .pill-val { font-size: 12px; font-weight: 600; color: #111827; }
            .chart { width: 100%; height: 260px; }
            .text-item { font-size: 12px; color: #111827; border-left: 3px solid #3B82F6; padding: 6px 8px; background: #F3F4F6; border-radius: 4px; margin: 6px 0; }
          </style>
        </head>
        <body>
          <h1>Feedback Question Report</h1>
          <h2>${eventTitle}</h2>
          <div class="card">
            <div style="font-size:14px;font-weight:700;margin-bottom:8px;">${questionTitle}</div>
            <div class="meta">
              <div class="pill"><div class="pill-title">Question #</div><div class="pill-val">${
                parseInt(qIndex, 10) + 1
              }</div></div>
              <div class="pill"><div class="pill-title">Type</div><div class="pill-val">${questionType}</div></div>
              <div class="pill"><div class="pill-title">Responses</div><div class="pill-val">${totalResponses}</div></div>
            </div>
          </div>

          ${
            questionType !== "Text"
              ? `
          <div class="card">
            <canvas id="qChart" class="chart"></canvas>
          </div>
          <script>
            const ctx = document.getElementById('qChart');
            const cfg = {
              type: '${questionType === "Rating" ? "bar" : "bar"}',
              data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                  label: 'Responses',
                  data: ${JSON.stringify(data)},
                  backgroundColor: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#22C55E','#F97316'].slice(0, ${
                    labels.length
                  }),
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false }, title: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
              }
            };
            new Chart(ctx, cfg);
          </script>
          `
              : ""
          }

          ${
            questionType === "Text"
              ? `
          <div class="card">
            ${(responses || [])
              .slice(0, 50)
              .map(
                (r) =>
                  `<div class="text-item">"${String(r).replace(
                    /"/g,
                    '\\"'
                  )}"</div>`
              )
              .join("")}
          </div>
          `
              : ""
          }
        </body>
      </html>
    `;

    // ✅ Heroku-safe Puppeteer launch
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "30px", bottom: "30px", left: "24px", right: "24px" },
    });

    await browser.close();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=feedback-q${
        parseInt(qIndex, 10) + 1
      }-${safeTitle}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Feedback question report error:", error);
    res.status(500).json({ message: "Error generating question report" });
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
  getEventAnalyticsReport,
  samplePdf,
  getFeedbackQuestionReport,
};
