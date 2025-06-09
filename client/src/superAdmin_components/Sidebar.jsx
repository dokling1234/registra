import React, { useContext } from "react"; 
import { useNavigate, useLocation } from "react-router-dom";
import { AppContent } from "../context/AppContext"; 
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import Swal from 'sweetalert2';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, backendUrl, setUserData, setIsLoggedin } =
    useContext(AppContent); 

  const logout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You will be logged out of your account",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        axios.defaults.withCredentials = true;
        const { data } = await axios.post(backendUrl + "/api/auth/logout");
        if (data.success) {
          setIsLoggedin(false);
          setUserData(null);
          Swal.fire(
            'Logged Out!',
            'You have been successfully logged out.',
            'success'
          );
          navigate("/admin");
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col justify-between fixed">
      <div>
        <div className="text-center">
          <img 
            src={assets.logo} 
            alt="Logo" 
            className="w-32 h-auto object-contain hover:scale-105 transition-transform duration-300 mx-auto"
          />
        </div>
        <div className="mt-4 bg-gray-800/50 rounded-lg mx-3">
          <nav className="flex flex-col gap-1 p-2">
            <button
              onClick={() => navigate("/superadmin/dashboard")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/dashboard") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.dashboard_icon} alt="Dashboard Icon" className="w-5 h-5"/>
              Dashboard
            </button>
            <button
              onClick={() => navigate("/superadmin/report")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/report") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.reports_icon} alt="Reports Icon" className="w-5 h-5"/>
              Reports
            </button>
            <button
              onClick={() => navigate("/superadmin/feedback")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/feedback") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.feedback_icon} alt="Feedback Icon" className="w-5 h-5"/>
              Feedbacks
            </button>
            <button
              onClick={() => navigate("/superadmin/events")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/events") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.events_icon} alt="Events Icon" className="w-5 h-5"/>
              Events
            </button>
            <button
              onClick={() => navigate("/superadmin/receipt")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/receipt") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.receipt_icon} alt="Receipt Icon" className="w-5 h-5"/>
              Receipts
            </button>
           
            <button
              onClick={() => navigate("/superadmin/certificate")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/certificate") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.certificate_icon} alt="Certificate Icon" className="w-5 h-5"/>
              Certificates
            </button>
            <button
              onClick={() => navigate("/superadmin/userlist")}
              className={`text-left p-3 rounded-lg transition-colors ${
                isActive("/superadmin/userlist") ? "bg-gray-700" : "hover:bg-gray-700"
              } flex items-center gap-2`}
            >
              <img src={assets.userlist_icon} alt="Users Icon" className="w-5 h-5"/>
              Users
            </button>
          </nav>
        </div>
      </div>
      <div className="mt-4 bg-gray-800/50 rounded-lg mx-3 mb-4">
        <div className="p-2">
          <button
            onClick={logout}
            className="text-left hover:bg-gray-700 p-3 rounded-lg w-full transition-colors flex items-center gap-2"
          >
            <img src={assets.logout_icon} alt="Log Out Icon" className="w-5 h-5"/>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;