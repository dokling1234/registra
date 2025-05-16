import React, { useContext, useEffect, useState } from "react";
import EventCard from "../components/EventCard";
import Navbar from "../components/Navbar";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import "./EventList.css";
import Footer from "../components/Footer";

const EventList = ({ filters }) => {
  const { userData, backendUrl } = useContext(AppContent);
  const [events, setEvents] = useState([]);
  
  // back 2 default when navbar viewevent pressed
  const defaultFilters = {
    eventType: '',
    location: '',
    date: ''
  };

  // default fallback
  const appliedFilters = filters || defaultFilters;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/events");
        const allEvents = res.data.events;

        // filter student || pro || both
        const useruserType = userData?.userType?.toLowerCase();
        const targetFiltered = allEvents.filter((event) => {
          const eventTarget = event.eventTarget?.toLowerCase();
          return eventTarget === "both" || eventTarget === useruserType;
        });

        // user filters
        let filtered = [...targetFiltered]; 
        if (appliedFilters.eventType) {
          filtered = filtered.filter(
            (e) => e.eventType?.toLowerCase() === appliedFilters.eventType.toLowerCase()
          );
        }
        if (appliedFilters.location) {
          filtered = filtered.filter(
            (e) => e.location?.toLowerCase().includes(appliedFilters.location.toLowerCase())
          );
        }
        if (appliedFilters.startDate || appliedFilters.endDate) {
          filtered = filtered.filter((e) => {
            const eventDate = new Date(e.date);
            const start = appliedFilters.startDate ? new Date(appliedFilters.startDate) : null;
            const end = appliedFilters.endDate ? new Date(appliedFilters.endDate) : null;
        
            if (start && end) return eventDate >= start && eventDate <= end;
            if (start) return eventDate >= start;
            if (end) return eventDate <= end;
            return true;
          });
        }

        setEvents(filtered);
      } catch (err) {
        console.error("Error fetching events:", err.response?.data || err.message);
      }
    };

    if (userData?.userType) {
      fetchEvents();
    }
  }, [userData, appliedFilters]);

  return (
    <>
    {location.pathname !== "/home" && <Navbar className="navbar-spacing" />}
    <div className="event-list-container">
      <h2 className="section-heading">
        Upcoming <span className="highlight">Events</span>
      </h2>
      <div className="event-grid">
        {Array.isArray(events) && events.length > 0 ? (
          events.map((event) => <EventCard key={event._id} event={event} />)
        ) : (
          <p className="no-events-message">No events found or failed to load.</p>
        )}
      </div>
    </div>
    {location.pathname !== "/home" && <Footer/>}
  </>
  );
};

export default EventList;
