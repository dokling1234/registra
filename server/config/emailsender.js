import nodemailer from 'nodemailer';
export let otpStorage = {}; // Store OTPs for email verification
let otpTimestamps = {}; // Store timestamps for OTP requests

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: 'pernida12345@gmail.com', // Replace with your email
    pass: 'ivhgdymrsuzzkqrh', // Replace with your app password
  },
});

// Function to generate a random 4-digit OTP
export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function sendOTP(email, otp) {
  console.log("1111111111111111111111111111111111111111",otp)
  if (!canResendOTP(email)) {
    throw new Error('You can only request a new OTP every 5 minutes.');
  }
otpStorage[email] = otp; 
  const mailOptions = {
    from: 'pernida12345@gmail.com',
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP');
  }
}

function canResendOTP(email) {
  const now = Date.now();
  if (!otpTimestamps[email] || now - otpTimestamps[email] > 40 * 1000) { // 40 seconds
    otpTimestamps[email] = now;
    return true;
  }
  return false;
}
