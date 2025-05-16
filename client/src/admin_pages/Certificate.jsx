import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../admin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";

const Certificate = () => {
  const navigate = useNavigate();

  const { userData } = useContext(AppContent);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Push content to the right because Sidebar is fixed */}
      <div className="flex flex-col flex-1 ml-64">
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Certficate</h1>

            {userData ? (
              <div className="w-10 h-10 flex justify-center items-center rounded-full bg-black text-white relative group">
                {userData.fullName[0].toUpperCase()}
              </div>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
              >
                Login <img src={assets.arrow_icon} alt="" />
              </button>
            )}
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default Certificate;
