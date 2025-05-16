import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import "./Navbar.css"; // 👈 Import the CSS file

const Navbar = () => {
  const navigate = useNavigate();
  const { userData, backendUrl, setUserData, setIsLoggedin } =
    useContext(AppContent);

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        backendUrl + "/api/auth/send-verify-otp"
      );
      if (data.success) {
        navigate("/email-verify");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      data.success && setIsLoggedin(false);
      data.success && setUserData(false);
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="navbar">
      {/* Left Logo */}
      <img
        src={assets.logo}
        alt="Logo"
        className="navbar-logo"
        onClick={() => window.location.reload()}
      />

      {/* Centered Links */}
      <div className="navbar-links">
        <div onClick={() => navigate("/home")} className="navbar-text-link">
          Home
        </div>
        <div onClick={() => navigate("/about")} className="navbar-text-link">
          About Us
        </div>
        <div onClick={() => navigate("/map")} className="navbar-text-link">
          View Map
        </div>
        <div onClick={() => navigate("/events")} className="navbar-text-link">
          View Events
        </div>
        <div onClick={() => navigate("/events/registered")} className="navbar-text-link">
          My Events
        </div>
      </div>

      {/* Right User or Login */}
      <div className="navbar-user-area">
        {userData ? (
          <div className="navbar-user">
            {userData.fullName[0].toUpperCase()}
            <div className="navbar-user-dropdown">
              <ul>
                {!userData.isVerified && (
                  <li onClick={sendVerificationOtp}>Verify Email</li>
                )}
                <li onClick={() => navigate("/profile")}>Profile</li>
                <li onClick={logout}>Logout</li>
              </ul>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="navbar-login-button"
          >
            Login <img src={assets.arrow_icon} alt="arrow icon" className="ml-1 inline" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;