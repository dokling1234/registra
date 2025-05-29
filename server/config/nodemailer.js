const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport(
  {
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // generated ethereal user
      pass: process.env.SMTP_PASS, // generated ethereal password
    },
      tls: {
    rejectUnauthorized: false, // <-- This allows self-signed certs
  },
  },
);

module.exports = transporter;