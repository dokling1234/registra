import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import zxcvbn from "zxcvbn";
import { Eye, EyeOff } from "lucide-react";

axios.defaults.withCredentials = true; // ✅ ensure cookies are always sent

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCompact, setIsCompact] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(
    window.innerWidth >= 1280
  );
  const [showChangeModal, setShowChangeModal] = useState(false);

  const { backendUrl, setUserData, setIsLoggedin, userData } =
    useContext(AppContent);

  // Password states
  const [icpepId, setIcpepId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);

  // Password Strength
  const passwordStrength = zxcvbn(newPassword);
  const strengthLabel = ["Very Weak", "Weak", "Fair", "Good", "Strong"][
    passwordStrength.score
  ];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  // Compact mode detection
  useEffect(() => {
    const checkHeight = () => setIsCompact(window.innerHeight <= 667);
    checkHeight();
    window.addEventListener("resize", checkHeight);
    return () => window.removeEventListener("resize", checkHeight);
  }, []);

  // Show/hide sidebar based on width
  useEffect(() => {
    const handleResize = () => {
      const isXL = window.innerWidth >= 1280;
      setShowDesktopSidebar(isXL);
      if (isXL) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  // Logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Logout",
    });

    if (result.isConfirmed) {
      try {
        const { data } = await axios.post(`${backendUrl}/api/auth/logout`);
        if (data.success) {
          setIsLoggedin(false);
          setUserData(null);
          Swal.fire(
            "Logged Out",
            "You have been safely logged out.",
            "success"
          );
          navigate("/admin");
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return Swal.fire("Error", "Passwords do not match!", "error");
    }

    setChangeLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/change-password`,
        { newPassword, icpepId, email: userData?.email },
        { withCredentials: true }
      );

      if (data.success) {
        Swal.fire("Success", "Password updated successfully!", "success");
        setShowChangeModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setIcpepId("");
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to update password",
          "error"
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || error.message,
        "error"
      );
    } finally {
      setChangeLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const MenuItem = ({ path, label, icon, closeOnClick }) => (
    <div className="relative group">
      <button
        onClick={() => {
          navigate(path);
          if (closeOnClick) setIsOpen(false);
        }}
        className={`w-full flex items-center ${
          isCompact ? "justify-center p-2" : "gap-3 px-3 py-2"
        } rounded-lg transition-all duration-200 ${
          isActive(path)
            ? "bg-gray-700 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
      >
        <img src={icon} alt={label} className="w-5 h-5" />
        {!isCompact && (
          <span className="text-sm sm:text-base font-normal">{label}</span>
        )}
      </button>
      {isCompact && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
          {label}
        </span>
      )}
    </div>
  );

  const SidebarContent = ({ closeOnClick = false }) => (
    <div className="flex flex-col h-full justify-between overflow-y-auto max-h-screen scrollbar-hide">
      {/* Logo */}
      <div className="text-center mt-6 mb-4">
        <img
          src={assets.logo}
          alt="Logo"
          className={`${isCompact ? "w-10" : "w-32"} mx-auto object-contain`}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`flex flex-col gap-1 px-2 py-2 mx-2 bg-gray-800/50 rounded-lg ${
          isCompact ? "text-xs" : "text-sm sm:text-base"
        }`}
      >
        <MenuItem
          path="/admin/dashboard"
          label="Dashboard"
          icon={assets.dashboard_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/admin/report"
          label="Reports"
          icon={assets.reports_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/feedback"
          label="Feedbacks"
          icon={assets.feedback_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/admin/events"
          label="Events"
          icon={assets.events_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/admin/receipt"
          label="Receipts"
          icon={assets.receipt_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/certificate"
          label="Certificates"
          icon={assets.certificate_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/userlist"
          label="Users"
          icon={assets.userlist_icon}
          closeOnClick={closeOnClick}
        />
        <MenuItem
          path="/admin/activity-logs"
          label="Activity Logs"
          icon={assets.reports_icon}
          closeOnClick={closeOnClick}
        />

        {/* ✅ Change Password Button (matching style) */}
        <button
          onClick={() => setShowChangeModal(true)}
          className={`w-full flex items-center ${
            isCompact ? "justify-center p-2" : "gap-3 px-3 py-2"
          } rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-700 hover:text-white`}
        >
          <img
            src={assets.userlist_icon}
            alt="Change Password"
            className="w-5 h-5"
          />
          {!isCompact && <span>Change Password</span>}
        </button>
      </nav>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-700 pt-3 px-2 mx-2">
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 4, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={`w-full flex items-center justify-center ${
            isCompact ? "p-2" : "gap-3 px-3 py-2"
          } rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 shadow-md`}
        >
          <img src={assets.logout_icon} alt="Logout" className="w-5 h-5" />
          {!isCompact && <span>Logout</span>}
        </motion.button>

        {!isCompact && (
          <div className="text-center text-gray-500 text-xs sm:text-sm mt-4 mb-2 select-none">
            <p className="opacity-70">IcpepRegistra Admin</p>
            <p className="opacity-50">© {new Date().getFullYear()}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* --- Mobile Sidebar --- */}
      <AnimatePresence>
        {isOpen && !showDesktopSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm xl:hidden z-[9998]"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className={`fixed top-0 left-0 h-screen ${
                isCompact ? "w-16" : "w-56 sm:w-64"
              } bg-gray-900 text-white shadow-2xl z-[9999] flex flex-col`}
            >
              <SidebarContent closeOnClick />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Desktop Sidebar --- */}
      <AnimatePresence>
        {showDesktopSidebar && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`hidden xl:flex h-screen ${
              isCompact ? "w-16" : "w-56 sm:w-64"
            } bg-gray-900 text-white flex-col justify-between fixed left-0 top-0 z-[998] shadow-lg`}
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Change Password Modal --- */}
      <AnimatePresence>
        {showChangeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[10000]"
              onClick={() => setShowChangeModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="fixed z-[10001] inset-0 flex items-center justify-center p-4"
            >
              <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
                <h2 className="text-lg font-semibold mb-4 text-center">
                  Change Password
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <input
                    type="text"
                    placeholder="ICPEP ID (optional)"
                    value={icpepId}
                    onChange={(e) => setIcpepId(e.target.value)}
                    className="w-full border border-gray-600 bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* New Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-600 bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Strength Meter */}
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-gray-700 rounded">
                        <div
                          className={`h-2 rounded transition-all duration-500 ${
                            strengthColors[passwordStrength.score]
                          }`}
                          style={{
                            width: `${(passwordStrength.score + 1) * 20}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Strength:{" "}
                        <span className="font-medium">{strengthLabel}</span>
                      </p>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-600 bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowChangeModal(false)}
                      className="w-full py-2 rounded border border-gray-500 hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={changeLoading}
                      className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {changeLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
