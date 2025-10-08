const express = require('express');
const {isAuthenticated, login, logout, register, resetPassword, verifyResetOtp, sendResetOtp, sendVerifyOtp, verifyEmail, adminLogin, mobileAdminLogin, adminChangePassword, resendOTP,} = require('../controllers/authController.js');
const userAuth = require('../middleware/userAuth.js');

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/admin-login', adminLogin);
authRouter.post('/mobile/admin-login', mobileAdminLogin);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.post('/resend-otp', userAuth, resendOTP);
authRouter.get('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);
authRouter.post("/verify-reset-otp", verifyResetOtp);
authRouter.post("/change-password",userAuth, adminChangePassword);

module.exports = authRouter;