const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
require("dotenv/config");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/mongodb.js");
const authRouter = require("./routes/authRoutes.js");
const { userRouter, mobileUserRouter } = require("./routes/userRoutes.js");
const { eventRouter, mobileEventRouter } = require("./routes/eventRoutes.js");
const adminRouter = require("./routes/adminRoutes.js");
const {
  feedbackRoutes,
  mobileFeedbackRoutes,
} = require("./routes/feedbackRoutes.js");
const certificateRoutes = require("./routes/certificateRoutes.js");
const superAdminRouter = require("./routes/superAdminRoutes.js");
const activityLogRoutes = require("./routes/activityLogRoutes.js");

const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.1.212:4000",
  "http://192.168.1.212:3000",
  "https://registra-b7181b9e50a0.herokuapp.com",
]; // allowed to add to frontend

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://www.googletagmanager.com",
      ],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://*.cloudinary.com",
        "https://cdn.pixabay.com",
        "https://www.icpepncr.org",
        "https://logos-world.net",
        "https://www.google-analytics.com",
      ],
      connectSrc: [
        "'self'",
        "https://registra-b7181b9e50a0.herokuapp.com",
        "https://*.tile.openstreetmap.org",
        "https://api.maptiler.com",
        "https://api.cloudinary.com",
      ],
      frameAncestors: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self), camera=(self), microphone=()"
  );
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// API ENDPOINTS
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/mobile-user", mobileUserRouter);
app.use("/api/events", eventRouter);
app.use("/api/mobile-events", mobileEventRouter);
app.use("/api/admin", adminRouter);
app.use("/api/certificate", certificateRoutes);
app.use("/api/mobile-feedback", mobileFeedbackRoutes);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/activity-logs", activityLogRoutes);

// -------------------- PRODUCTION BUILD --------------------
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  // ✅ Dynamic OG tags for event pages
  // ✅ Dynamic OG tags for event pages (Bot-aware)
app.get("/events/:id", async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const isBot = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|discord/i.test(userAgent);

    const eventId = req.params.id;
    const response = await axios.get(
      `${process.env.BASE_URL || "http://localhost:4000"}/api/events/${eventId}`
    );
    const event = response.data.event;

    // If it's a bot — send a minimal OG response
    if (isBot) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>${event.title}</title>
            <meta property="og:type" content="website" />
            <meta property="og:url" content="${req.protocol}://${req.get("host")}${req.originalUrl}" />
            <meta property="og:title" content="${event.title}" />
            <meta property="og:description" content="${event.about}" />
            <meta property="og:image" content="${event.image}" />
            <meta property="og:site_name" content="Registra" />
            <meta property="og:locale" content="en_US" />
          </head>
          <body>
            <script>window.location.href = "${req.originalUrl}";</script>
          </body>
        </html>
      `);
    }

    // ✅ Otherwise — normal users get React frontend
    res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
  } catch (err) {
    console.error("Error generating OG tags:", err.message);
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  }
});


  // Fallback: all other routes → React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}
// ----------------------------------------------------------

app.listen(port, () => console.log(`Server is running on port ${port}`));
