import { Router } from 'express';
import * as UserController from '../mobile_controllers/user.controller.js';
import {sendOTPHandler, login, register} from '../mobile_controllers/user.controller.js';
//import {  } from '../config/emailsender.js';

const mobileUserRouter = Router();

mobileUserRouter.post('/registration', register);
mobileUserRouter.post('/login', login);
mobileUserRouter.post('/verification', UserController.verifyOTP);
mobileUserRouter.post('/sendOTP', sendOTPHandler);
mobileUserRouter.post('/resendOTP', UserController.resendOTP);
mobileUserRouter.post('/resetverifyOTP', UserController.resetverifyOTP);
mobileUserRouter.post('/updateProfile', UserController.updateProfile);
mobileUserRouter.post('/resetPassword', UserController.resetPassword);
mobileUserRouter.post('/check-email', UserController.checkEmail);

export default mobileUserRouter;
