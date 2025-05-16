import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { AppContent } from "../context/AppContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    axios.defaults.withCredentials = true;

    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
        isAdmin: true, // 👈 tells backend this is an admin login
      });

      if (data.success) {
        const userType = data.user?.userType;

        if (!userType) {
          toast.error("userType not found. Something went wrong.");
          return;
        }

        setIsLoggedin(true);
        await getUserData();
        toast.success(data.message);

        if (userType === "admin") {
          setTimeout( async () => {  
          navigate("dashboard");
          },100);
        } else {
          navigate("/admin");
        }
        
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
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

        <p className="text-center text-sm mb-6">Enter your admin credentials</p>

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
              type={showPassword ? "text" : "password"} // Toggle input type
              placeholder="Password"
              required
            />
            <img
              src={
                showPassword ? assets.eye_open_icon : assets.eye_closed_icon
              } // Use appropriate eye icon
              alt={showPassword ? "Hide Password" : "Show Password"}
              className="w-5 h-5 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)} // Toggle visibility
            />
          </div>
          <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
