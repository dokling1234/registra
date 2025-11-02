import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { assets } from "../assets/assets";
import EventCard from "../components/RegisteredEventCard";
import { motion, AnimatePresence } from "framer-motion";

// Heroicons
import {
  UserIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { userData, backendUrl, getUserData, isAdmin } = useContext(AppContent);
  const navigate = useNavigate();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [aboutMe, setAboutMe] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = "event_preset";

  // Security states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [globalMessage, setGlobalMessage] = useState({ text: "", type: "" });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [pastEvents, setPastEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("all");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Phone number validation
  const isValidPhilippineNumber = (number) => {
    const str = String(number || "").trim();
    const regex = /^(0\d{10}|639\d{9})$/;
    return regex.test(str);
  };

  useEffect(() => {
    if (isAdmin) navigate("/");
  }, [isAdmin, navigate]);

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
      setAboutMe(userData.aboutMe || "");
    }
  }, [userData]);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      if (!userData?.id) return;
      try {
        const res = await axios.get(
          `${backendUrl}/api/mobile-events/events/events_registered`,
          { params: { userId: userData.id } }
        );
        const currentDate = new Date();
        setPastEvents(res.data.filter((e) => new Date(e.date) < currentDate));
        setUpcomingEvents(
          res.data.filter((e) => new Date(e.date) >= currentDate)
        );
      } catch (error) {
        console.error("Failed to fetch registered events:", error);
      }
    };
    fetchRegisteredEvents();
  }, [userData, backendUrl]);

  // ✅ Clear messages automatically
  useEffect(() => {
    if (globalMessage.text) {
      const timer = setTimeout(() => {
        setGlobalMessage({ text: "", type: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // ✅ Reset password state when switching tab
  useEffect(() => {
    if (activeTab !== "security") {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [activeTab]);

  // ================== PROFILE ==================
  const handleSaveProfile = async () => {
    if (
      !String(formData.fullName || "").trim() ||
      !isValidPhilippineNumber(formData.contactNumber) ||
      isUploading
    ) {
      setGlobalMessage({
        text: "⚠️ Please provide a valid name and contact number.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await axios.put(
        `${backendUrl}/api/user/update`,
        { ...formData, aboutMe, profileImage: formData.profileImage },
        { withCredentials: true }
      );
      if (res.data.success) {
        setIsEditing(false);
        await getUserData();
        setGlobalMessage({
          text: "✅ Profile updated successfully.",
          type: "success",
        });
      }
    } catch {
      setGlobalMessage({
        text: "❌ Update failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(URL.createObjectURL(file));

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", uploadPreset);

    try {
      setIsUploading(true);
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formDataUpload,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: false,
        }
      );
      setFormData((prev) => ({ ...prev, profileImage: res.data.secure_url }));
      setGlobalMessage({
        text: "✅ Photo uploaded. Don’t forget to Save Profile.",
        type: "success",
      });
    } catch {
      setGlobalMessage({ text: "❌ Upload failed. Try again.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profileImage: "" }));
    setSelectedImage(null);
    setGlobalMessage({
      text: "✅ Photo removed. Default avatar applied.",
      type: "success",
    });
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contactNumber") {
      // Remove non-digit characters
      let formatted = value.replace(/[^\d]/g, "");

      // Auto-correct to 09XXXXXXXXXX format
      if (formatted.startsWith("639") && formatted.length > 3) {
        formatted = "09" + formatted.slice(3);
      } else if (formatted.startsWith("9") && formatted.length >= 1) {
        formatted = "0" + formatted;
      }

      // Limit to 11 digits
      if (formatted.startsWith("0")) {
        formatted = formatted.slice(0, 11);
      }
      // Allow typing 6 as first digit for 639 prefix
      else if (formatted.startsWith("6")) {
        // do nothing, allow user to continue typing 639
      } else if (formatted.length > 0) {
        // block invalid input
        formatted = "";
      }

      setFormData((prev) => ({ ...prev, [name]: formatted }));

      // Set error if number is invalid
      setErrors((prev) => ({
        ...prev,
        [name]: !isValidPhilippineNumber(formatted),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({
        ...prev,
        [name]: !String(value || "").trim(),
      }));
    }
  };
  // ================== SECURITY ==================
  const getPasswordStrength = (password) => {
    if (!password) return { label: "", color: "", score: 0 };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1)
      return { label: "Weak", color: "text-red-500", score: 25 };
    if (strength === 2)
      return { label: "Medium", color: "text-yellow-500", score: 50 };
    if (strength === 3)
      return { label: "Good", color: "text-blue-500", score: 75 };
    if (strength >= 4)
      return { label: "Strong", color: "text-green-600", score: 100 };
    return { label: "", color: "", score: 0 };
  };

  const validatePasswords = (field, value) => {
    let errors = { ...passwordErrors };

    if (field === "currentPassword" && !value) {
      errors.currentPassword = "Current password is required.";
    } else if (field === "currentPassword") {
      errors.currentPassword = "";
    }

    if (field === "newPassword") {
      if (!value) errors.newPassword = "New password is required.";
      else if (value.length < 8)
        errors.newPassword = "Password must be at least 8 characters.";
      else errors.newPassword = "";
    }

    if (field === "confirmPassword") {
      if (!value) errors.confirmPassword = "Please confirm your new password.";
      else if (value !== passwordData.newPassword)
        errors.confirmPassword = "Passwords do not match.";
      else errors.confirmPassword = "";
    }

    setPasswordErrors(errors);
  };

  const handleResetPassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    validatePasswords("currentPassword", currentPassword);
    validatePasswords("newPassword", newPassword);
    validatePasswords("confirmPassword", confirmPassword);

    const hasErrors =
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      passwordErrors.currentPassword ||
      passwordErrors.newPassword ||
      passwordErrors.confirmPassword;

    if (hasErrors) return;

    try {
      setIsSavingPassword(true); // 🔹 start spinner
      const res = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setGlobalMessage({
          text: "✅ Password reset successfully.",
          type: "success",
        });
      } else {
        const msg = res.data?.message?.toLowerCase() || "";
        if (msg.includes("current password") || msg.includes("incorrect")) {
          setPasswordErrors((prev) => ({
            ...prev,
            currentPassword:
              res.data?.message || "Current password is incorrect.",
          }));
        } else {
          setGlobalMessage({
            text: res.data?.message || "❌ Error resetting password.",
            type: "error",
          });
        }
      }
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message || "";
      if (status === 400 || status === 401) {
        setPasswordErrors((prev) => ({
          ...prev,
          currentPassword: serverMsg || "Current password is incorrect.",
        }));
      } else {
        setGlobalMessage({
          text: serverMsg || "❌ Error resetting password.",
          type: "error",
        });
      }
    } finally {
      setIsSavingPassword(false); // 🔹 stop spinner
    }
  };

  const togglePasswordVisibility = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const disableSavePassword =
    !passwordData.currentPassword ||
    !passwordData.newPassword ||
    !passwordData.confirmPassword ||
    !!passwordErrors.currentPassword ||
    !!passwordErrors.newPassword ||
    !!passwordErrors.confirmPassword;

  // Variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12, // delay between each card
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.9 },
  };

  // ================== RENDER ==================
  return (
    <>
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white py-3 px-3 sm:px-4 min-h-[calc(80vh-60px)]">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-3 h-auto">
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-x-0 top-16 bottom-0 bg-black bg-opacity-40 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          {/* Sidebar */}
          <aside
            className={`fixed md:static top-1/2 md:top-0 left-1/2 md:left-0 
            w-64 md:w-56 bg-white shadow rounded-xl p-4 flex flex-col gap-2 z-40 
            transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 
            transition-transform duration-300
            ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            } md:opacity-100 md:pointer-events-auto`}
          >
            <button
              className="md:hidden self-end mb-3 text-gray-600 hover:text-gray-800"
              onClick={() => setSidebarOpen(false)}
            >
              ✖
            </button>
            <button
              onClick={() => {
                setActiveTab("profile");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <UserIcon className="w-5 h-5" /> <span>Profile</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("security");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                activeTab === "security"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LockClosedIcon className="w-5 h-5" /> <span>Security</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("events");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                activeTab === "events"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CalendarDaysIcon className="w-5 h-5" /> <span>Events</span>
            </button>
          </aside>

          {/* Sidebar Toggle */}
          <button
            className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-lg mb-3 w-fit self-end"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Menu
          </button>

          {/* Main Content */}
          <main className="flex-1 bg-white shadow rounded-xl p-4 sm:p-5 h-fit">
            {/* ✅ Global Message */}
            {globalMessage.text && (
              <div
                className={`mb-3 p-2 text-center rounded-lg text-sm font-medium ${
                  globalMessage.type === "success"
                    ? "bg-green-100 text-green-700"
                    : globalMessage.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {globalMessage.text}
              </div>
            )}
            {/* Profile */}
            {activeTab === "profile" && (
              <div className="h-fit">
                {!isEditing ? (
                  <div className="flex flex-col items-center text-center gap-2 h-fit">
                    <div className="relative">
                      <img
                        src={
                          selectedImage ||
                          formData.profileImage ||
                          assets.default_profile
                        }
                        alt="Profile"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-blue-200 object-cover shadow"
                      />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                      {formData.fullName}
                    </h2>
                    <p className="text-gray-500 text-sm">{formData.email}</p>
                    <p className="text-gray-500 text-sm">
                      ICPEP ID: {formData.icpepId}
                    </p>
                    <p className="capitalize text-gray-500 text-sm">
                      {formData.userType}
                    </p>
                    <div className="w-full max-w-lg bg-gray-50 p-3 rounded-lg mt-2 text-left h-fit">
                      <h3 className="font-semibold text-gray-700 mb-1">
                        About Me
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {aboutMe || "No description yet."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 justify-center">
                      <button
                        className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto h-fit">
                    <h2 className="text-lg sm:text-xl font-bold mb-3">
                      Edit Profile
                    </h2>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <img
                          src={
                            selectedImage ||
                            formData.profileImage ||
                            assets.default_profile
                          }
                          alt="Profile"
                          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-blue-200 object-cover shadow"
                        />
                        {/* Change Photo */}
                        <button
                          onClick={() => fileInputRef.current.click()}
                          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow hover:bg-blue-700 transition"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                          ) : (
                            "📷"
                          )}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                      {formData.profileImage && !isUploading && (
                        <button
                          onClick={handleRemovePhoto}
                          className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="mt-1 w-full border px-3 py-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          readOnly
                          className="mt-1 w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          className={`mt-1 w-full border px-3 py-2 rounded-lg ${
                            errors.contactNumber ? "border-red-500" : ""
                          }`}
                        />
                        {errors.contactNumber && (
                          <p className="text-red-500 text-sm mt-1">
                            Invalid Philippine number format.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          ICPEP ID
                        </label>
                        <input
                          type="text"
                          value={formData.icpepId}
                          readOnly
                          className="mt-1 w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          User Type
                        </label>
                        <input
                          type="text"
                          value={formData.userType}
                          readOnly
                          className="mt-1 w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          About Me
                        </label>
                        <textarea
                          value={aboutMe}
                          onChange={(e) => setAboutMe(e.target.value)}
                          rows="3"
                          className="mt-1 w-full border px-3 py-2 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={
                          !String(formData.fullName || "").trim() ||
                          !isValidPhilippineNumber(formData.contactNumber) ||
                          isUploading ||
                          isSaving
                        }
                        className={`px-4 sm:px-6 py-2 rounded-lg w-full sm:w-auto text-white text-center ${
                          !String(formData.fullName || "").trim() ||
                          !isValidPhilippineNumber(formData.contactNumber) ||
                          isUploading ||
                          isSaving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } ${
                          isSaving
                            ? "flex items-center justify-center gap-2"
                            : ""
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-lg w-full sm:w-auto"
                        onClick={() => setIsEditing(false)}
                        disabled={isUploading || isSaving}
                      >
                        Cancel
                      </button>
                    </div>

                    {/* ✅ Local message under Save button */}
                    {globalMessage.text && activeTab === "profile" && (
                      <div
                        className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                          globalMessage.type === "success"
                            ? "bg-green-100 text-green-700"
                            : globalMessage.type === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {globalMessage.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Security */}
            {activeTab === "security" && (
              <div className="max-w-md mx-auto h-fit">
                <h2 className="text-lg sm:text-xl font-bold mb-3">
                  Reset Password
                </h2>
                {["currentPassword", "newPassword", "confirmPassword"].map(
                  (field) => (
                    <div key={field} className="mb-3">
                      <label className="block text-sm font-medium capitalize">
                        {field.replace("Password", " Password")}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords[field] ? "text" : "password"}
                          value={passwordData[field]}
                          onChange={(e) => {
                            setPasswordData((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }));
                            validatePasswords(field, e.target.value);
                          }}
                          className={`mt-1 w-full border px-3 py-2 rounded-lg ${
                            passwordErrors[field] ? "border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              [field]: !prev[field],
                            }))
                          }
                        >
                          {showPasswords[field] ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeSlashIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Error Message */}
                      {passwordErrors[field] && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordErrors[field]}
                        </p>
                      )}

                      {/* Strength Indicator */}
                      {field === "newPassword" && passwordData.newPassword && (
                        <>
                          {!passwordErrors.newPassword && (
                            <>
                              <p
                                className={`mt-1 text-sm font-medium ${passwordStrength.color}`}
                              >
                                {passwordStrength.label} Password
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full ${passwordStrength.color}`}
                                  style={{
                                    width: `${passwordStrength.score}%`,
                                  }}
                                ></div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleResetPassword}
                    disabled={disableSavePassword || isSavingPassword}
                    className={`px-4 sm:px-6 py-2 rounded-lg w-full sm:w-auto text-white text-center ${
                      disableSavePassword || isSavingPassword
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } ${
                      isSavingPassword
                        ? "flex items-center justify-center gap-2"
                        : ""
                    }`}
                  >
                    {isSavingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Password"
                    )}
                  </button>
                </div>

                {/* ✅ Local message under Save Password button */}
                {globalMessage.text && activeTab === "security" && (
                  <div
                    className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                      globalMessage.type === "success"
                        ? "bg-green-100 text-green-700"
                        : globalMessage.type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {globalMessage.text}
                  </div>
                )}
              </div>
            )}
            {activeTab === "events" && (
              <div className="h-fit">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-center text-blue-700">
                  My Events
                </h2>

                {/* Filter Buttons with Motion */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {["all", "upcoming", "past"].map((filter) => (
                    <motion.button
                      key={filter}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`px-4 py-2 rounded-lg border-2 font-medium w-full sm:w-auto transition-colors
            ${
              eventFilter === filter
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "text-blue-600 border-blue-600 hover:bg-blue-50"
            }`}
                      onClick={() => setEventFilter(filter)}
                    >
                      {filter === "all"
                        ? "All Events"
                        : filter[0].toUpperCase() + filter.slice(1)}
                    </motion.button>
                  ))}
                </div>

                {/* Animated Events Grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={eventFilter}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto w-full"
                  >
                    {(eventFilter === "all"
                      ? [...upcomingEvents, ...pastEvents]
                      : eventFilter === "upcoming"
                      ? upcomingEvents
                      : pastEvents
                    ).map((event) => (
                      <motion.div
                        key={event._id}
                        variants={cardVariants}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Empty State */}
                {(eventFilter === "all" &&
                  !pastEvents.length &&
                  !upcomingEvents.length) ||
                (eventFilter === "upcoming" && !upcomingEvents.length) ||
                (eventFilter === "past" && !pastEvents.length) ? (
                  <p className="text-center text-gray-500 mt-6 text-sm sm:text-base">
                    No events found.
                  </p>
                ) : null}
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer className="mt-2" />
    </>
  );
};

export default Profile;
