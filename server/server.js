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

// connect to Mongo
connectDB();

// allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.1.212:4000",
  "http://192.168.1.212:3000",
  "https://registra-b7181b9e50a0.herokuapp.com",
  "https://www.icpepncrregistra.com",
  "https://icpepncrregistra.com",
  "https://www.registra-b7181b9e50a0.herokuapp.com/",
  "https://registra-b7181b9e50a0.herokuapp.com/"
];

// helmet + CSP
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
        "https://res.cloudinary.com",
      ],
      frameAncestors: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  })
);

// permissions policy
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

// -------------------- API routes --------------------
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

  // ✅ Dynamic OG tags for event detail pages
  app.get("/events/:id", async (req, res) => {
    const eventId = req.params.id;

    try {
      // fetch event data from API
      const response = await axios.get(
        `${
          process.env.BASE_URL || "http://localhost:4000"
        }/api/events/${eventId}`
      );
      const event = response.data.event;

      // load CRA index.html
      const indexFile = path.resolve(__dirname, "../client/build/index.html");
      let html = fs.readFileSync(indexFile, "utf8");

      // build meta tags
      const metaTags = `
        <title>${event.title}</title>
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${req.protocol}://${req.get("host")}${
        req.originalUrl
      }" />
        <meta property="og:title" content="${event.title}" />
        <meta property="og:description" content="${
          event.about
        } | Date: ${new Date(event.date).toDateString()} | Location: ${
        event.location
      }" />
        <meta property="og:image" content="${event.image}" />
        <meta property="og:site_name" content="Registra" />
        <meta property="og:locale" content="en_US" />
         <meta property="fb:app_id" content="704250539358567" />
      `;

      // ✅ safer inject into <head>
      html = html.replace(/<head[^>]*>/, `<head>${metaTags}`);
      res.send(html);
    } catch (err) {
      console.error("Error generating OG tags:", err.message);
      res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
    }
  });

  // fallback for all other routes
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
  });
}

// -------------------- START SERVER --------------------
app.listen(port, () =>
  console.log(`✅ Server is running on http://localhost:${port}`)
);
