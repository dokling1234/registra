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
    user: "pernida12345@gmail.com", 
    pass: "ivhgdymrsuzzkqrh", 
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to generate a random 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();

}

async function sendOTP(email, otp, template = PASSWORD_RESET_TEMPLATE, subject = "OTP Verification") {
  console.log(email+"emailsender"+otp);
  if (!canResendOTP(email)) {
    console.log(email);
    throw new Error("You can only request a new OTP every 5 minutes.");
  }
  otpStorage[email] = otp;
  const mailOptions = {
    from: "pernida12345@gmail.com",
    to: email,
    subject: subject,
    html: template.replace("{{otp}}", otp).replace(
      "{{email}}",
      email
    ),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
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
  otpStorage,
  transporter,
  otpTimestamps,
};