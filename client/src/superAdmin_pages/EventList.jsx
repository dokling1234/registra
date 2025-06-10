import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../superAdmin_components/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const EventList = () => {
  const navigate = useNavigate();
  const { userData, isAdmin } = useContext(AppContent);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      // Not an admin, redirect to home or another page
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events");
        setEvents(res.data.events);
      } catch (err) {
        console.error(
          "Error fetching events:",
          err.response?.data || err.message
        );
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Events</h1>
          {userData ? (
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {userData.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-lg font-semibold text-gray-800">
                  {userData.fullName}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
            >
              Login <img src={assets.arrow_icon} alt="Arrow Icon" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-200 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Event Type</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-6 py-4">{event.title}</td>
                    <td className="px-6 py-4">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{event.time}</td>
                    <td className="px-6 py-4">{event.location}</td>
                    <td className="px-6 py-4">₱{event.price}</td>
                    <td className="px-6 py-4">{event.eventType}</td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 italic">Done</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center px-6 py-4 text-gray-500"
                  >
                    No events found or failed to load.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default EventList;
