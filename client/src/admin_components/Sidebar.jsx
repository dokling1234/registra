import React, { useContext } from "react"; // Import useContext
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext"; // Import AppContent
import axios from "axios";
import { toast } from "react-toastify";

const Sidebar = () => {
  const navigate = useNavigate();
  const { userData, backendUrl, setUserData, setIsLoggedin } =
    useContext(AppContent); // Use AppContent context

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      if (data.success) {
        setIsLoggedin(false);
        setUserData(null);
        navigate("/");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col justify-between fixed">
      <div>
        <h2 className="text-3xl font-bold p-6"> {userData.fullName}</h2>
        <nav className="flex flex-col gap-4 px-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/feedback")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Feedback
          </button>
          <button
            onClick={() => navigate("")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Participants
          </button>
          <button
            onClick={() => navigate("")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Receipt
          </button>
          <button
            onClick={() => navigate("/addevent")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Add Event
          </button>
          <button
            onClick={() => navigate("/report")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Report
          </button>
          <button
            onClick={() => navigate("/adminevents")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            View Events
          </button>
          <button
            onClick={() => navigate("/certificate")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Certificate
          </button>
          <button
            onClick={() => navigate("/userlist")}
            className="text-left hover:bg-gray-700 p-2 rounded"
          >
            Users
          </button>
        </nav>
      </div>
      <div className="px-6 pb-6">
        <button
          onClick={logout}
          className="text-left hover:bg-gray-700 p-2 rounded w-full"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;