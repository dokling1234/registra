
const express = require('express');
const userAuth = require('../middleware/userAuth.js');
const { getUserData, updateUserData, resetPassword, getAllUsers, getAllAdmins, sendOTPHandler,verifyOTP, mobileLogin, mobileRegister,
    resendOTP, resetverifyOTP, updateProfile, mobileResetPassword, checkEmail } = require('../controllers/userController.js');

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData); // get user data
userRouter.put('/update', userAuth, updateUserData); // get user data
userRouter.post('/reset-password', userAuth, resetPassword); // reset password
userRouter.get('/alldata', userAuth, getAllUsers);
userRouter.get('/admins', userAuth, getAllAdmins);

const mobileUserRouter = express.Router();

mobileUserRouter.post('/login', mobileLogin);
mobileUserRouter.post('/registration', mobileRegister);
mobileUserRouter.post('/verification', verifyOTP);
mobileUserRouter.post('/sendOTP', sendOTPHandler);
mobileUserRouter.post('/resendOTP', resendOTP);
mobileUserRouter.post('/resetverifyOTP', resetverifyOTP);
mobileUserRouter.post('/updateProfile', updateProfile);
mobileUserRouter.post('/resetPassword', mobileResetPassword);
mobileUserRouter.post('/check-email', checkEmail);

module.exports = {userRouter, mobileUserRouter};