const express = require("express");
const cors = require("cors");
require("dotenv/config");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/mongodb.js");
const authRouter = require("./routes/authRoutes.js");
const {userRouter, mobileUserRouter} = require("./routes/userRoutes.js");
const {eventRouter, mobileEventRouter} = require("./routes/eventRoutes.js");
const adminRouter = require("./routes/adminRoutes.js");
const {feedbackRoutes, mobileFeedbackRoutes} = require("./routes/feedbackRoutes.js");
const certificateRoutes = require("./routes/certificateRoutes.js");
const superAdminRouter = require("./routes/superAdminRoutes.js");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.1.212:4000",
  "http://192.168.1.212:3000",
]; // allowed to add to frontend

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API ENDPOINTS
app.get("/", (req, res) => {
  res.send("API is running");
});
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRouter); // auth routes
app.use("/api/user", userRouter); // user routes
app.use("/api/mobile-user", mobileUserRouter); 
app.use("/api/events", eventRouter);
app.use("/api/mobile-events", mobileEventRouter); 
app.use("/api/admin", adminRouter);
app.use("/api/certificate", certificateRoutes);
app.use("/api/mobile-feedback", mobileFeedbackRoutes);
app.use("/api/superadmin", superAdminRouter);

app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(`Request from IP: ${ip}, Method: ${req.method}, URL: ${req.url}`);
  next();
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

app.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);
