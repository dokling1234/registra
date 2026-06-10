import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../admin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import FeedbackBuilder from "../admin_components/FeedbackBuilder";
import { Menu, X } from "lucide-react"; // For icons

const Feedback = () => {
  const navigate = useNavigate();
  const { userData, isAdmin } = useContext(AppContent);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  // Close sidebar when clicking outside (on mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && !e.target.closest(".sidebar") && !e.target.closest(".menu-btn")) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1">
      {/* Mobile top bar */}
      <div className="bg-gray-900 text-white flex items-center justify-between p-2 sm:p-3 lg:p-4 shadow-md xl:hidden sticky top-0 z-50">
        <button onClick={() => setSidebarOpen(true)} className="p-1">
          <Menu size={18} className="sm:w-5 sm:h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold">Feedback</h1>
        <div className="w-5 sm:w-6" />
      </div>

        {/* Content area */}
        <main className="flex-1 p-2 sm:p-3 lg:p-6 xl:ml-64">
          {/* Desktop header (title + user box) */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="hidden xl:block">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Feedback</h1>
            </div>
            {userData ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs sm:text-sm lg:text-base">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs text-gray-500">Welcome back,</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-gray-800">{userData.fullName}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-1 border border-gray-500 rounded-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-gray-800 hover:bg-gray-100 transition-all text-xs sm:text-sm lg:text-base justify-center"
              >
                Login <img src={assets.arrow_icon} alt="arrow" className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Feedback Builder */}
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 lg:p-4">
            <FeedbackBuilder />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Feedback;
