import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import Swal from "sweetalert2";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);
  const [adminId, setAdminId] = useState(null);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    axios.defaults.withCredentials = true;

    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/admin-login`, {
        email,
        password,
        isAdmin: true, // ✅ allows both admin and superadmin
      });
      if (data.passwordChangeRequired) {
        setAdminId(data.adminId);
        setShowPasswordChangePopup(true);
      } else
      
      if (data.success) {

        const userType = data.user?.userType;
        console.log(data.user);
        if (!userType) {
          toast.error("userType not found. Something went wrong.");
          return;
        }

        setIsLoggedin(true);
        await getUserData();
        toast.success(data.message);

        // 🔥 Redirect based on role
        if (userType === "admin") {
          navigate("/admin/dashboard");
        } else if (userType === "superadmin") {
          navigate("/superadmin/dashboard"); // ✅ Route for superadmin
        } else {
          toast.error("Invalid user type.");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handlePasswordChange = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/change-password`,
        {
          adminId,
          newPassword,
        }
      );
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password updated. Please log in again.",
          timer: 1500,
          showConfirmButton: false
        });
        setShowPasswordChangePopup(false);
        setNewPassword("");
        // Optional: redirect to login or auto login
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message,
          confirmButtonText: "OK"
        });
      }
    } catch (error) {
      console.error("Password change failed:", error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to change password. Please try again.",
        confirmButtonText: "OK"
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="Logo"
        className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
      />
      <div className="bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm">
        <h2 className="text-3xl font-semibold text-white mb-3 text-center">
          Admin Login
        </h2>

        <p className="text-center text-sm mb-6">Enter your credentials</p>

        <form onSubmit={onSubmitHandler}>
          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.mail_icon} alt="" />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none"
              type="email"
              placeholder="Email"
              required
            />
          </div>
          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C] relative">
            <img src={assets.lock_icon} alt="" />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="bg-transparent outline-none flex-1"
              type={showPassword ? "" : "password"}
              placeholder="Password"
              required
            />
            <img
              src={showPassword ? assets.eye_open_icon : assets.eye_closed_icon}
              alt={showPassword ? "Hide Password" : "Show Password"}
              className="w-5 h-5 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            />
          </div>
          <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium">
            Sign In
          </button>
        </form>
        {showPasswordChangePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Change Your Password</h2>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border w-full mb-3 px-3 py-2 rounded"
              />
              <button
                onClick={handlePasswordChange}
                className="bg-blue-600 text-white px-4 py-2 rounded w-full"
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
