const nodemailer = require("nodemailer");
const {
  PASSWORD_RESET_TEMPLATE,
  EMAIL_VERIFY_TEMPLATE,
  LOGIN_OTP_TEMPLATE,
} = require("./emailTemplates");

let otpStorage = {};
let otpTimestamps = {};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, 
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to generate a random 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendOTP(email, otp, template = EMAIL_VERIFY_TEMPLATE, subject = "OTP Verification") {
  if (!canResendOTP(email)) {
    throw new Error("You can only request a new OTP every 5 minutes.");
  }
  //otpStorage[email] = otp;
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: subject,
    html: template.replace("{{otp}}", otp).replace(
      "{{email}}",
      email
    ),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error.message, error.stack);
    throw new Error("Failed to send OTP");
  }
}

async function sendResetOTP(email, otp, template = PASSWORD_RESET_TEMPLATE, subject = "OTP Verification") {
  if (!canResendOTP(email)) {
    throw new Error("You can only request a new OTP every 5 minutes.");
  }
  otpStorage[email] = otp;
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: subject,
    html: template.replace("{{otp}}", otp).replace(
      "{{email}}",
      email
    ),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error.message, error.stack);
    throw new Error("Failed to send OTP");
  }
}

function canResendOTP(email) {
  const now = Date.now();
  if (!otpTimestamps[email] || now - otpTimestamps[email] > 40 * 1000) {
    // 40 seconds
    otpTimestamps[email] = now;
    return true;
  }
  return false;
}
module.exports = {
  generateOTP,
  sendOTP,
  canResendOTP,
  sendResetOTP,
  otpStorage,
  transporter,
  otpTimestamps,
};