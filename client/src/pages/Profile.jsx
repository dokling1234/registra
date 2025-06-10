import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer"; 
import { AppContent } from "../context/AppContext";
import axios from "axios"; 
import "./Profile.css"; 
import { assets } from "../assets/assets";
import EventCard from "../components/RegisteredEventCard";
import Swal from "sweetalert2";

const Profile = () => {
  const { userData, backendUrl, getUserData } = useContext(AppContent); 
  const [isEditing, setIsEditing] = useState(false); 
  const [isResettingPassword, setIsResettingPassword] = useState(false); 
  const [formData, setFormData] = useState({}); 
  const [aboutMe, setaboutMe] = useState(""); 
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }); 
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  }); 
  const [pastEvents, setPastEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("all"); 

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
      setaboutMe(userData.aboutMe || ""); 
    }
  }, [userData]);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      if (!userData?.id) return;
      try {
        const res = await axios.get(
          `${backendUrl}/api/mobile-events/events/events_registered`,
          {
            params: { userId: userData.id },
          }
        );

        const currentDate = new Date();
        const past = res.data.filter(
          (event) => new Date(event.date) < currentDate
        );
        const upcoming = res.data.filter(
          (event) => new Date(event.date) >= currentDate
        );

        setPastEvents(past);
        setUpcomingEvents(upcoming);
      } catch (error) {
        console.error("Failed to fetch registered events:", error);
      }
    };

    fetchRegisteredEvents();
  }, [userData, backendUrl]);

  const handleEditProfile = () => {
    setIsEditing(true); 
  };

  const handleImageClick = () => {
     if (isEditing) {
      Swal.fire({
        title: 'Change Profile Picture',
        text: 'Would you like to change your profile picture?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, change it!',
        cancelButtonText: 'No, cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          fileInputRef.current.click();
          
        }
      });
    }
  };
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    console.log(file);
    console.log(cloudName);

    if (!file) return;

    setSelectedImage(URL.createObjectURL(file)); 

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
      console.log("uploaded");
      Swal.fire({
        title: 'Success!',
        text: 'Profile picture uploaded successfully!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error response:", error.response?.data || error.message);
      await Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload image. Please try again.",
        confirmButtonText: "OK",
      });
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Changes you made won't be saved!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel editing!",
      cancelButtonText: "No, keep editing",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Canceled!",
          text: "Your changes have been discarded.",
          icon: "success",
        });

        setIsEditing(false);
        setSelectedImage(null); 
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          contactNumber: userData.contactNumber || "",
          userType: userData.userType || "",
          icpepId: userData.icpepId || "",
          profileImage: userData.profileImage || "",
        });
        setaboutMe(userData.aboutMe || "");
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleaboutMeChange = (e) => {
    setaboutMe(e.target.value); 
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
    console.log("Form Data:", formData); 
    console.log("About Us:", aboutMe); 

    try {
      const response = await axios.put(
        `${backendUrl}/api/user/update`,
        { ...formData, aboutMe },
        {
          withCredentials: true, 
        }
      );

      console.log("Server Response:", response.data); 

      if (response.data.success) {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Your work has been saved",
          showConfirmButton: false,
          timer: 1500,
        });
        setIsEditing(false); 
        await getUserData(); 
      } else {
        await Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: response.data.message || "Failed to update profile.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error); 
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "An error occurred while updating the profile.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleResetPassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please fill in all password fields before resetting.",
      });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Weak Password",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Password reset successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setIsResettingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: response.data.message || "Failed to reset password.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "An error occurred while resetting the password.",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-10 text-gray-800">My Profile</h1>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <img
              src={
                selectedImage || formData.profileImage || assets.default_profile
              }
              className="w-40 h-40 rounded-full border-4 border-blue-200 object-cover shadow-lg"
              alt="Profile"
              onClick={handleImageClick}
              style={{ cursor: isEditing ? "pointer" : "default" }}
            />
            {isEditing && (
              <button
                className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow hover:bg-blue-700 transition"
                onClick={handleImageClick}
                type="button"
              >
                Change
              </button>
            )}
          </div>
          {isUploading && <p className="text-blue-600 mb-2">Uploading...</p>}
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <div className="w-full flex flex-col items-center">
            {isEditing ? (
              <>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Type
                    </label>
                    <input
                      type="text"
                      name="userType"
                      value={formData.userType}
                      readOnly
                      className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ICPEP ID
                    </label>
                    <input
                      type="text"
                      name="icpepId"
                      value={formData.icpepId}
                      readOnly
                      className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About Me
                    </label>
                    <textarea
                      name="aboutMe"
                      value={aboutMe}
                      onChange={handleaboutMeChange}
                      rows="3"
                      className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                    onClick={handleSaveProfile}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-400 transition"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-yellow-600 transition"
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
                <h2 className="text-2xl font-bold mb-1 text-gray-800">
                  {userData?.fullName || "N/A"}
                </h2>
                <p className="text-gray-500 mb-1 capitalize">
                  {userData?.userType || "N/A"}
                </p>
                <p className="text-gray-500 mb-4">{userData?.email || "N/A"}</p>
                <button
                  className="bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition mb-2"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
        <div className="profile-section">
          <h3 className="profile-section-title">About Me</h3>
          <p className="profile-section-content">
            {userData?.aboutMe || "N/A"}
          </p>
        </div>
        <div className="events-section">
          <h2 className="events-title">
            My <span>Events</span>
          </h2>

          <div className="event-filters">
            <button
              className={`filter-button ${
                eventFilter === "all" ? "active" : ""
              }`}
              onClick={() => setEventFilter("all")}
            >
              All Events
            </button>
            <button
              className={`filter-button ${
                eventFilter === "upcoming" ? "active" : ""
              }`}
              onClick={() => setEventFilter("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`filter-button ${
                eventFilter === "past" ? "active" : ""
              }`}
              onClick={() => setEventFilter("past")}
            >
              Past
            </button>
          </div>

          {eventFilter === "all" &&
            pastEvents.length === 0 &&
            upcomingEvents.length === 0 && (
              <p className="no-events-message">No events found.</p>
            )}
          {eventFilter === "past" && pastEvents.length === 0 && (
            <p className="no-events-message">No past events found.</p>
          )}
          {eventFilter === "upcoming" && upcomingEvents.length === 0 && (
            <p className="no-events-message">No upcoming events found.</p>
          )}

          <div className="events-grid">
            {eventFilter === "all" && (
              <>
                {upcomingEvents.map((event) => (
                  <div key={event._id} className="event-card">
                    <EventCard event={event} />
                  </div>
                ))}
                {pastEvents.map((event) => (
                  <div key={event._id} className="event-card">
                    <EventCard event={event} />
                  </div>
                ))}
              </>
            )}
            {eventFilter === "upcoming" &&
              upcomingEvents.map((event) => (
                <div key={event._id} className="event-card">
                  <EventCard event={event} />
                </div>
              ))}
            {eventFilter === "past" &&
              pastEvents.map((event) => (
                <div key={event._id} className="event-card">
                  <EventCard event={event} />
                </div>
              ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
