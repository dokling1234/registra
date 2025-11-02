import React, { useContext, useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, backendUrl, setUserData, setIsLoggedin } =
    useContext(AppContent);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const defaultProfilePic =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You will be logged out of your account",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, logout!",
      });

      if (result.isConfirmed) {
        axios.defaults.withCredentials = true;
        const { data } = await axios.post(backendUrl + "/api/auth/logout");
        if (data.success) {
          setIsLoggedin(false);
          setUserData(false);
          navigate("/");
          Swal.fire(
            "Logged Out!",
            "You have been successfully logged out.",
            "success"
          );
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const scrollToSection = (id) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  return (
    <nav className="sticky top-0 left-0 w-full z-50 backdrop-blur-md bg-white/80 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-10 py-2 md:py-4">
        {/* Logo */}
        <img
          src={assets.logo}
          alt="Logo"
          className="w-20 md:w-28 cursor-pointer object-contain"
          onClick={() => window.location.reload()}
        />

        {/* Hamburger (Mobile) */}
        <div
          className="flex flex-col justify-center md:hidden cursor-pointer w-7 h-7"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="h-[2px] w-full bg-gray-800 rounded-md mb-1"></span>
          <span className="h-[2px] w-full bg-gray-800 rounded-md mb-1"></span>
          <span className="h-[2px] w-full bg-gray-800 rounded-md"></span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <div
            onClick={() => handleNav("/home")}
            className={`cursor-pointer text-xl font-medium ${
              location.pathname === "/home"
                ? "text-blue-600 font-semibold bg-blue-50 px-3.5 py-2 rounded-md"
                : "text-gray-800 hover:text-blue-600"
            }`}
          >
            Home
          </div>

          {/* About Us Dropdown */}
          <div className="relative">
            <div
              onClick={() => handleNav("/about")}
              className={`cursor-pointer text-lg font-medium flex items-center ${
                location.pathname === "/about"
                  ? "text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-md"
                  : "text-gray-800 hover:text-blue-600"
              }`}
            >
              About Us
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className={`ml-1 text-sm transition-transform ${
                  dropdownOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                ▾
              </span>
            </div>

            {dropdownOpen && (
              <div className="absolute mt-2 bg-white shadow-md rounded-lg w-44 z-20 border border-gray-100">
                {["mission", "vision", "history", "officers"].map((section) => (
                  <div
                    key={section}
                    onClick={() => {
                      handleNav("/about");
                      scrollToSection(section);
                      setDropdownOpen(false);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 cursor-pointer text-base capitalize"
                  >
                    {section}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            onClick={() => handleNav("/map")}
            className={`cursor-pointer text-lg font-medium ${
              location.pathname === "/map"
                ? "text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-md"
                : "text-gray-800 hover:text-blue-600"
            }`}
          >
            Event Map
          </div>

          <div
            onClick={() => handleNav("/events")}
            className={`cursor-pointer text-lg font-medium ${
              location.pathname === "/events"
                ? "text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-md"
                : "text-gray-800 hover:text-blue-600"
            }`}
          >
            Events
          </div>
        </div>

        {/* User Area */}
        <div className="hidden md:flex items-center gap-4" ref={dropdownRef}>
          {userData ? (
            <div className="relative">
              <img
                src={userData.profileImage || defaultProfilePic}
                alt="Profile"
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfilePic;
                }}
              />

              {/* Animated Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 bg-white shadow-lg rounded-lg w-64 border border-gray-100 z-50"
                  >
                    <ul className="py-2 text-gray-700 text-base">
                      <li
                        onClick={() => {
                          handleNav("/profile");
                          setProfileOpen(false);
                        }}
                        className="px-5 py-3 hover:bg-gray-100 hover:text-blue-600 cursor-pointer flex items-center gap-3"
                      >
                        <span className="text-xl">👤</span>
                        <span className="font-medium">Profile</span>
                      </li>
                      <li
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                        }}
                        className="px-5 py-3 hover:bg-gray-100 hover:text-blue-600 cursor-pointer flex items-center gap-3"
                      >
                        <span className="text-xl">🚪</span>
                        <span className="font-medium">Logout</span>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => handleNav("/")}
              className="mt-4 border border-gray-800 text-gray-800 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-800 hover:text-white transition-all text-base w-fit"
            >
              Login →
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="flex flex-col md:hidden bg-white px-6 py-3 shadow-md border-t">
          <div
            onClick={() => handleNav("/home")}
            className={`py-2.5 text-lg ${
              location.pathname === "/home"
                ? "text-blue-600 font-semibold"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Home
          </div>

          {/* About Us (Mobile Dropdown) */}
          <div>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex justify-between items-center py-2 text-lg text-gray-700 hover:text-blue-600 cursor-pointer"
            >
              About Us
              <span
                className={`transition-transform ${
                  dropdownOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                ▾
              </span>
            </div>
            {dropdownOpen && (
              <div className="flex flex-col ml-4 text-gray-600">
                {["mission", "vision", "history", "officers"].map((section) => (
                  <div
                    key={section}
                    onClick={() => {
                      handleNav("/about");
                      scrollToSection(section);
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                    className="py-1 cursor-pointer hover:text-blue-600 capitalize"
                  >
                    {section}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            onClick={() => handleNav("/map")}
            className={`py-2 text-lg ${
              location.pathname === "/map"
                ? "text-blue-600 font-semibold"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Event Map
          </div>

          <div
            onClick={() => handleNav("/events")}
            className={`py-2 text-lg ${
              location.pathname === "/events"
                ? "text-blue-600 font-semibold"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Events
          </div>

          {userData ? (
            <div className="mt-4">
              <div
                onClick={() => handleNav("/profile")}
                className="py-2 text-gray-700 hover:text-blue-600 cursor-pointer"
              >
                👤 Profile
              </div>
              <div
                onClick={logout}
                className="py-2 text-gray-700 hover:text-blue-600 cursor-pointer"
              >
                🚪 Logout
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNav("/")}
              className="mt-4 border border-gray-800 text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-gray-800 hover:text-white transition-all w-fit"
            >
              Login →
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
