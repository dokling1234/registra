import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from '../admin_components/Sidebar';
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";


const Home = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [totalEvents, setTotalEvents] = useState(0);
    const [totalAdmins, setTotalAdmins] = useState(0);
  const { userData } = useContext(AppContent);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/alldata`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setTotalUsers(response.data.count);
          console.log("Total users:", response.data.count); // Debugging  
        } else {
          console.error("Failed to fetch users:", response.data.message);
        }

      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/events`, 
          { withCredentials: false }
        );
  
        if (response.data.success) {
          setTotalEvents(response.data.count);
          console.log("Total events:", response.data.count); // Debugging
        } else {
          console.error("Failed to fetch events:", response.data.message);
        }
  
      } catch (error) {
        console.error("Error fetching events:", error.message);
      }
    };
  
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/admins`, 
          { withCredentials: true }
        );
  
        if (response.data.success) {
          setTotalAdmins(response.data.count);
          console.log("Total admins:", response.data.count); // Debugging
        } else {
          console.error("Failed to fetch events:", response.data.message);
        }
  
      } catch (error) {
        console.error("Error fetching events:", error.message);
      }
    };
  
    fetchAdmins();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Push content to the right because Sidebar is fixed */}
      <div className="flex flex-col flex-1 ml-64">


        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1> {/* Dashboard title */}

            {/* User Profile or Login Button */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Total Users</p>
              <h2 className="text-3xl font-bold">{totalUsers}</h2>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Participants</p>
              <h2 className="text-3xl font-bold">0</h2>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Events</p>
              <h2 className="text-3xl font-bold">{totalEvents}</h2>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Total Admin</p>
              <h2 className="text-3xl font-bold">{totalAdmins}</h2>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
