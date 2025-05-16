import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';

class UserService {
  static async registerUser(
    fullName,
    contactNumber,
    email,
    password,
    confirmPassword,
    icpepId,
    age,
    userType,
    membership,
    aboutMe = "",
    profileImage = ""
  ) {
    try {
      const createUser = new userModel({
        fullName,
        contactNumber,
        email,
        password,
        confirmPassword,
        icpepId: membership === "Member" ? icpepId : null,
        age,
        userType,
        membership,
        aboutMe,
        profileImage,
      });
      return await createUser.save();
    } catch (err) {
      throw err;
    }
  }

  static async checkuser(email) {
    try {
      return await userModel.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(email, hashedPassword) {
    try {
      const result = await userModel.updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  static async generateToken(tokenData, secretKey, jwt_expire) {
    return jwt.sign(tokenData, secretKey, { expiresIn: jwt_expire });
  }

  static async verifyUser(email, isVerified) {
    try {
      const result = await userModel.updateOne(
        { email },
        { $set: { isVerified: true } }
      );
      return result;
    } catch (err) {
      throw err;
    }
  }
}

export default UserService;
