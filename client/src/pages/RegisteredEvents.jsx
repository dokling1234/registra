import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import RegisteredEventCard from "../components/RegisteredEventCard";
import Footer from "../components/Footer";

const RegisteredEvents = () => {
  const { backendUrl, isAdmin } = useContext(AppContent);
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'past'

  useEffect(() => {
    if (isAdmin) {
      navigate("/"); // Redirect admins
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/events/registered`);
        setEvents(res.data.events || []);
      } catch (err) {
        console.error(
          "Error fetching registered events:",
          err.response?.data || err.message
        );
      }
    };

    fetchEvents();
  }, [backendUrl]);

  const filteredEvents = events.filter((event) => {
    if (filter === "upcoming") return !event.isPastEvent;
    if (filter === "past") return event.isPastEvent;
    return true; // all
  });

  return (
    <div className="flex flex-col min-h-screen">
      {location.pathname !== "/" && <Navbar />}

      {/* Filter Buttons */}
      <div className="mt-24 sm:mt-28 flex justify-center gap-3">
        {["all", "upcoming", "past"].map((btn) => (
          <button
            key={btn}
            className={`px-4 py-2 rounded-md border text-sm sm:text-base font-medium transition
              ${
                filter === btn
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
            onClick={() => setFilter(btn)}
          >
            {btn.charAt(0).toUpperCase() + btn.slice(1)}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">
        {Array.isArray(filteredEvents) && filteredEvents.length > 0 ? (
          <div
            className="grid gap-6 sm:gap-8 
                       grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredEvents.map((event) => (
              <RegisteredEventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm sm:text-base mt-10">
            No events match this filter.
          </p>
        )}
      </div>

      {location.pathname !== "/home" && <Footer />}
    </div>
  );
};

export default RegisteredEvents;
