import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import mobileUserRouter from "./mobile_routes/user.router.js";
import mobileEventRouter from "./mobile_routes/events.router.js";
import mobileAdminRouter from "./mobile_admin_routes/admin.router.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import path from "path";

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
app.use(cors({ origin: allowedOrigins, credentials: true })); // allow cross-origin requests

// API ENDPOINTS
app.get("/", (req, res) => {
  res.send("API is running");
});
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRouter); // auth routes
app.use("/api/user", userRouter); // user routes
app.use("/api/events", eventRouter);
app.use("/api/admin", adminRouter);
app.use("/api/location", eventRouter);

app.use("/", mobileUserRouter);
app.use("/", mobileEventRouter);
app.use("/admin", mobileAdminRouter);
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

app.listen(port, "0.0.0.0", () =>
  console.log(`Server is running on port ${port}`)
);
