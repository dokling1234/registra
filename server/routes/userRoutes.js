import express from 'express';
import { getUserData, updateUserData, resetPassword, getAllUsers, getAllAdmins } from '../controllers/userController.js';
import { userAuth, userTypeAuth } from '../middleware/userAuth.js';

const userRouter = express.Router();
userRouter.get('/data', userAuth, getUserData); // get user data
userRouter.put('/update', userAuth, updateUserData); // get user data
userRouter.post('/reset-password', userAuth, resetPassword); // reset password
userRouter.get('/alldata', userAuth, getAllUsers);
userRouter.get('/admins', userAuth, getAllAdmins);

export default userRouter;