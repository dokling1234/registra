import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from '../superAdmin_components/Sidebar';
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import FeedbackBuilder from "../superAdmin_components/FeedbackBuilder";


const Feedback = () => {
  const navigate = useNavigate();
  const { userData, isAdmin } = useContext(AppContent);

  useEffect(() => {
        if (!isAdmin) {
          // Not an admin, redirect to home or another page
          navigate("/admin");
        }
      }, [isAdmin, navigate]);


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Push content to the right because Sidebar is fixed */}
      <div className="flex flex-col flex-1 ml-64">


        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Feedback</h1> {/* Dashboard title */}

            {userData ? (
               <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                 <span className="text-blue-600 font-semibold text-lg">
                   {userData.fullName.charAt(0).toUpperCase()}
                 </span>
               </div>
               <div className="flex flex-col">
                 <p className="text-sm text-gray-500">Welcome back,</p>
                 <p className="text-lg font-semibold text-gray-800">{userData.fullName}</p>
               </div>
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
          <FeedbackBuilder />
        </main>
      </div>
    </div>
  );
};

export default Feedback;