import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import db from '../config/db.js';

const { Schema } = mongoose;

const UserSchema = new Schema({
  fullName: {
    type: String,
    lowercase: true,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  },
  icpepId: {
    type: String,
    required: function () {
      return this.membership === "member"; // Required only if membership is "Member"
    },
    unique: true,
  },
  membership: {
    type: String,
    required: true, // Ensure membership is required
  },
  age: {
    type: Number,
    required: true,
    min: 10,
    max: 99,
  },
  userType: {
    type: String,
    required: true,
  },
  aboutMe: {
    type: String,
    lowercase: true,
    default: "", // Default to an empty string
  },
  profileImage: {
    type: String,
    default: "default-profile.png", // Default profile image
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});
// Pre-save: Hash passwords
UserSchema.pre('save', async function(next) {
  try {
      const user = this;
      if (!user.isModified('password')) return next();

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      user.confirmPassword = await bcrypt.hash(user.confirmPassword, salt);

      next();
  } catch (error) {
      next(error);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (userPassword) {
    try {
        return await bcrypt.compare(userPassword, this.password);
    } catch (error) {
        throw error;
    }
};

const userModel = db.model('user', UserSchema);

export default userModel;
