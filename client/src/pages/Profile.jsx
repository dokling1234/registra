import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar"; // Import the Navbar component
import Footer from "../components/Footer"; // Import the Footer component
import { AppContent } from "../context/AppContext";
import axios from "axios"; // Import Axios for API calls
import "./Profile.css"; // Import the CSS file for styling
import { assets } from "../assets/assets";

const Profile = () => {
  const { userData, backendUrl, getUserData } = useContext(AppContent); // Access user data and backend URL from context
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [isResettingPassword, setIsResettingPassword] = useState(false); // State to toggle reset password mode
  const [formData, setFormData] = useState({}); // State to store form data
  const [aboutMe, setaboutMe] = useState(""); // State to store About Us description
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }); // State to store password reset data
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  }); // State to toggle visibility of password fields
  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        contactNumber: userData.contactNumber || "",
        userType: userData.userType || "",
        icpepId: userData.icpepId || "",
        profileImage: userData.profileImage || "",
      });
      setaboutMe(userData.aboutMe || ""); // Initialize About Us description
    }
  }, [userData]);

  const handleEditProfile = () => {
    setIsEditing(true); // Enable edit mode
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click(); // Trigger file input if editing
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file)); // For immediate preview

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "event_preset");
    try {
      setIsUploading(true);
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          withCredentials: false,
        }
      );
      setFormData((prev) => ({ ...prev, profileImage: res.data.secure_url }));
      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedImage(null); // Reset preview
    setFormData({
      fullName: userData.fullName || "",
      email: userData.email || "",
      contactNumber: userData.contactNumber || "",
      userType: userData.userType || "",
      icpepId: userData.icpepId || "",
      profileImage: userData.profileImage || "",
    });
    setaboutMe(userData.aboutMe || "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleaboutMeChange = (e) => {
    setaboutMe(e.target.value); // Update About Us description
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const handleSaveProfile = async () => {
    console.log("Form Data:", formData); // Log the form data for debugging
    console.log("About Us:", aboutMe); // Log the About Us description

    try {
      const response = await axios.put(
        `${backendUrl}/api/user/update`,
        { ...formData, aboutMe },
        {
          withCredentials: true, // Ensure credentials are included
        }
      );

      console.log("Server Response:", response.data); // Log the server response

      if (response.data.success) {
        alert("Profile updated successfully!");
        setIsEditing(false); // Exit edit mode
        await getUserData(); // Refresh user data
      } else {
        alert(response.data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error); // Log the error
      alert(
        error.response?.data?.message ||
          "An error occurred while updating the profile."
      );
    }
  };

  const handleResetPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("Password reset successfully!");
        setIsResettingPassword(false); // Exit reset password mode
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert(response.data.message || "Failed to reset password.");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "An error occurred while resetting the password."
      );
    }
  };

  return (
    <>
      <div>
        <Navbar className="navbar-spacing" /> {/* Add the Navbar */}
        <h1 className="profile-heading">My Profile</h1>
        <div className="profile-container">
          <div className="profile-header">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageChange}
            />
             <div className="profile-picture-wrapper">
            <img
      src={
        selectedImage || formData.profileImage || assets.default_profile
      }
      className="profile-picture"
      alt="Profile"
      onClick={handleImageClick}
      style={{ cursor: isEditing ? "pointer" : "default" }}
    />
    {isEditing && (
  <button
    className="edit-icon-hover"
    onClick={handleImageClick}
    type="button"
  >
    Change Profile Picture
  </button>
    )}
    </div>
            {isUploading && <p>Uploading...</p>}
          </div>
          <div className="profile-details">
            {isEditing ? (
              <>
                {/* Profile Editing Form */}
                <div className="form-group">
                  <label htmlFor="fullName">Name:</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly // Lock the email field
                    className="read-only-input" // Apply the read-only style
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number:</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="userType">userType:</label>
                  <input
                    type="text"
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    readOnly // Lock the userType field
                    className="read-only-input" // Apply the read-only style
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="icpepId">ICPEP ID:</label>
                  <input
                    type="text"
                    id="icpepId"
                    name="icpepId"
                    value={formData.icpepId}
                    readOnly // Lock the ICPEP ID field
                    className="read-only-input" // Apply the read-only style
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aboutMe">About Me:</label>
                  <textarea
                    id="aboutMe"
                    name="aboutMe"
                    value={aboutMe}
                    onChange={handleaboutMeChange}
                    rows="4"
                    className="about-us-textarea"
                  />
                </div>

                <div className="edit-buttons-container">
                  <button
                    className="save-profile-button"
                    onClick={handleSaveProfile}
                  >
                    Save
                  </button>
                  <button
                    className="cancel-edit-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="reset-password-button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsResettingPassword(true);
                    }}
                  >
                    Reset Password
                  </button>
                </div>
              </>
            ) : isResettingPassword ? (
              <>
                {/* Reset Password Form */}
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password:</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.currentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                    />
                    <button
                      type="button"
                      className="toggle-password-button"
                      onClick={() =>
                        togglePasswordVisibility("currentPassword")
                      }
                    >
                      <img
                        src={
                          showPasswords.currentPassword
                            ? assets.eye_open_icon
                            : assets.eye_closed_icon
                        }
                        alt={
                          showPasswords.currentPassword
                            ? "Hide Password"
                            : "Show Password"
                        }
                        className="password-icon"
                      />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password:</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.newPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                    />
                    <button
                      type="button"
                      className="toggle-password-button"
                      onClick={() => togglePasswordVisibility("newPassword")}
                    >
                      <img
                        src={
                          showPasswords.newPassword
                            ? assets.eye_open_icon
                            : assets.eye_closed_icon
                        }
                        alt={
                          showPasswords.newPassword
                            ? "Hide Password"
                            : "Show Password"
                        }
                        className="password-icon"
                      />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password:</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input-field"
                    />
                    <button
                      type="button"
                      className="toggle-password-button"
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                    >
                      <img
                        src={
                          showPasswords.confirmPassword
                            ? assets.eye_open_icon
                            : assets.eye_closed_icon
                        }
                        alt={
                          showPasswords.confirmPassword
                            ? "Hide Password"
                            : "Show Password"
                        }
                        className="password-icon"
                      />
                    </button>
                  </div>
                </div>
                <button
                  className="save-profile-button"
                  onClick={handleResetPassword}
                >
                  Reset Password
                </button>
                <button
                  className="cancel-edit-button"
                  onClick={() => setIsResettingPassword(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {/* Profile Details */}
                <p className="profile-name">
                   {userData?.fullName || "N/A"}
                </p>
                <p classname ="profile-userType">
                   {userData?.userType || "N/A"}
                </p>
                <p className="profile-email">
                   {userData?.email || "N/A"}
                </p>

                <button
                  className="edit-profile-button"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
        <p className="about-me-description">
          <strong>About Me:</strong>
          <p>{userData?.aboutMe || "N/A"}</p>
        </p>
        <h2 className="PastEvent-heading">
        Upcoming <span className="highlight">Events</span>
      </h2>
        <div className="additional-containers">
          <div className="custom-container">
            <img
              src="https://via.placeholder.com/150"
              alt="Placeholder 1"
              className="placeholder-img"
            />
            <p>Container 1 Content</p>
          </div>
          <div className="custom-container">
            <img
              src="https://via.placeholder.com/150"
              alt="Placeholder 2"
              className="placeholder-img"
            />
            <p>Container 2 Content</p>
          </div>
          <div className="custom-container">
            <img
              src="https://via.placeholder.com/150"
              alt="Placeholder 3"
              className="placeholder-img"
            />
            <p>Container 3 Content</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Profile;