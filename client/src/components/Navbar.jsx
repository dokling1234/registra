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

  // Default profile picture
  const defaultProfilePic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
            <img 
              src={userData.profileImage || defaultProfilePic} 
              alt="Profile" 
              className="w-12 h-12 rounded-full object-cover border-2 border-black"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultProfilePic;
              }}
            />
            <div className="navbar-user-dropdown">
              <ul>
                <li
                  onClick={() => {
                    handleNav("/profile");
                  }}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile
                </li>
                <li
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
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