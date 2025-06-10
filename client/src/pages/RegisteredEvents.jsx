import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import RegisteredEventCard from "../components/RegisteredEventCard";
import "./RegisteredEvents.css";
import Footer from "../components/Footer";

const RegisteredEvents = () => {
  const { backendUrl, isAdmin } = useContext(AppContent);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'past'


  useEffect(() => {
      if (isAdmin) {
        // Not an admin, redirect to home or another page
        navigate("/");
      }
    }, [isAdmin, navigate]);
  
    
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/events/registered`);
        setEvents(res.data.events); // Assume isPastEvent is already included
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
    <div className="page-container">
      {location.pathname !== "/" && <Navbar />}

      <div className="registered-events-container">
        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "upcoming" ? "active" : ""}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={filter === "past" ? "active" : ""}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
        </div>

        <div className="events-grid">
          {Array.isArray(filteredEvents) && filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <RegisteredEventCard key={event._id} event={event} />
            ))
          ) : (
            <p className="no-events-message">No events match this filter.</p>
          )}
        </div>
      </div>

      {location.pathname !== "/home" && <Footer className="Footer-spacing" />}
    </div>
  );
};

export default RegisteredEvents;
