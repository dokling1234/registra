import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import bcrypt from "bcryptjs";

export const getUserData = async (req, res) => {
    try {
        const { userId, name } = req.user; // get userId from request body
        
        const user = await userModel.findById(userId); // find user by userId
        if (!user) {
            return res.json({ success: false, message: "User not found getuserdata usercont" });

        }

        res.json({ 
            success: true, 
            userData:{
                fullName: user.fullName,
                isVerified: user.isVerified,
                userType: user.userType,
                email: user.email,
                contactNumber: user.contactNumber,
                icpepId: user.icpepId,
                aboutMe: user.aboutMe, 
                membership: user.membership,
                profileImage: user.profileImage,
            }
        }); // send user data in response


    } catch (error) {
        res.json({ success: false, message: error.message });
        
    }
}
export const getAllUsers = async (req, res) => {
  try {
    console.log("usercontroller getallusers..."); // Debugging
    const users = await userModel.find({}); // Fetch all users from the database

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found." });
    }

    res.json({ success: true, users, count: users.length }); 
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
export const updateUserData = async (req, res) => {
  try {

    const userId = req.user.userId; // Get userId from userAuth middleware
    const { fullName, contactNumber, aboutMe, profileImage } = req.body; // Extract only the fields you want to update

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { fullName, contactNumber, aboutMe, profileImage }, // Only update these fields
      { new: true } // Return the updated document
    );


    if (updatedUser) {
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from userAuth middleware
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    console.log("usercontroller getalladmins..."); // Debugging

    const admins = await adminModel.find({}); // Fetch all users from the database

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "No users found." });
    }

    res.json({ success: true, admins, count: admins.length }); 
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};