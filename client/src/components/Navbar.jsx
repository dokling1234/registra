import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, backendUrl, setUserData, setIsLoggedin } =
    useContext(AppContent);

  const [menuOpen, setMenuOpen] = useState(false);

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
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You will be logged out of your account",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout!'
      });

      if (result.isConfirmed) {
        axios.defaults.withCredentials = true;
        const { data } = await axios.post(backendUrl + "/api/auth/logout");
        data.success && setIsLoggedin(false);
        data.success && setUserData(false);
        navigate("/");
        Swal.fire(
          'Logged Out!',
          'You have been successfully logged out.',
          'success'
        );
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Close menu when navigating
  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className={`navbar${menuOpen ? " navbar-menu-active" : ""}`}>
      {/* Left Logo */}
      <img
        src={assets.logo}
        alt="Logo"
        className="navbar-logo"
        onClick={() => window.location.reload()}
      />

      {/* Hamburger Icon */}
      <div
        className="navbar-hamburger"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Links and User Area (in hamburger on mobile) */}
      <div className="navbar-links">
        <div 
          onClick={() => handleNav("/home")} 
          className={`navbar-text-link ${location.pathname === "/home" ? "active" : ""}`}
        >
          Home
        </div>
        <div 
          onClick={() => handleNav("/about")} 
          className={`navbar-text-link ${location.pathname === "/about" ? "active" : ""}`}
        >
          About Us
        </div>
        <div 
          onClick={() => handleNav("/map")} 
          className={`navbar-text-link ${location.pathname === "/map" ? "active" : ""}`}
        >
          Event Map
        </div>
        <div 
          onClick={() => handleNav("/events")} 
          className={`navbar-text-link ${location.pathname === "/events" ? "active" : ""}`}
        >
          Events
        </div>
      </div>

      <div className="navbar-user-area">
        {userData ? (
          <div className="navbar-user">
            {userData.fullName[0].toUpperCase()}
            <div className="navbar-user-dropdown">
              <ul>
                {!userData.isVerified && (
                  <li
                    onClick={() => {
                      sendVerificationOtp();
                      setMenuOpen(false);
                    }}
                  >
                    Verify Email
                  </li>
                )}
                <li
                  onClick={() => {
                    handleNav("/profile");
                  }}
                >
                  Profile
                </li>
                <li
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  Logout
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleNav("/")}
            className="navbar-login-button"
          >
            Login{" "}
            <img
              src={assets.arrow_icon}
              alt="arrow icon"
              className="ml-1 inline"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;