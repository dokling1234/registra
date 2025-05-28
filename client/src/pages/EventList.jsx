import React, { useContext, useEffect, useRef, useState } from "react";
import EventCard from "../components/EventCard";
import Navbar from "../components/Navbar";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Footer from "../components/Footer";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./EventList.css";

const EventList = ({ filters }) => {
  const { userData, backendUrl } = useContext(AppContent);
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [visibleUpcoming, setVisibleUpcoming] = useState(3);
  const [visiblePast, setVisiblePast] = useState(3);

  const upcomingRef = useRef(null);
  const pastRef = useRef(null);
  const upcomingLastCardRef = useRef(null);
  const pastLastCardRef = useRef(null);

  const defaultFilters = {
    eventType: '',
    location: '',
    date: ''
  };

  const appliedFilters = filters || defaultFilters;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/events");
        const allEvents = res.data.events;

        const useruserType = userData?.userType?.toLowerCase();
        const targetFiltered = allEvents.filter((event) => {
          const eventTarget = event.eventTarget?.toLowerCase();
          return eventTarget === "both" || eventTarget === useruserType;
        });

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

        const currentDate = new Date();
        const upcoming = filtered.filter(event => new Date(event.date) >= currentDate);
        const past = filtered.filter(event => new Date(event.date) < currentDate);

        setEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        console.error("Error fetching events:", err.response?.data || err.message);
      }
    };

    if (userData?.userType) {
      fetchEvents();
    }
  }, [userData, appliedFilters]);

  const handleScroll = (type, ref, cardRef = null) => {
    const offset = 100;

    if (type === "less" && ref?.current) {
      window.scrollTo({
        top: ref.current.offsetTop - offset,
        behavior: "smooth"
      });
    } else if (type === "more" && cardRef?.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetTop = rect.top + scrollTop - offset;
      window.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      {location.pathname !== "/home" && <Navbar className="navbar-spacing" />}
      <div className="event-list-outer-container">
        <div className="event-list-container">
          <h2 className="section-heading" ref={upcomingRef}>
            Upcoming <span className="highlight">Events</span>
          </h2>
          <div className="event-grid">
            <AnimatePresence>
              {events.slice(0, visibleUpcoming).map((event, idx) => {
                const isLastVisible = idx === visibleUpcoming - 1;
                return (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.3 }}
                    ref={isLastVisible ? upcomingLastCardRef : null}
                  >
                    <EventCard event={event} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {events.length > 3 && (
            <div className="event-button-group">
              {visibleUpcoming < events.length ? (
                <button
                  onClick={() => {
                    setVisibleUpcoming(prev => {
                      const newCount = prev + 3;
                      setTimeout(() => handleScroll("more", null, upcomingLastCardRef), 300);
                      return newCount;
                    });
                  }}
                  className="event-toggle-btn"
                >
                  Load More
                </button>
              ) : (
                <button
                  onClick={() => {
                    setVisibleUpcoming(3);
                    setTimeout(() => handleScroll("less", upcomingRef), 300);
                  }}
                  className="event-toggle-btn"
                >
                  Show Less
                </button>
              )}
            </div>
          )}

          <h2 className="section-heading past-events-heading" ref={pastRef}>
            Past <span className="highlight">Events</span>
          </h2>
          <div className="event-grid">
            <AnimatePresence>
              {pastEvents.slice(0, visiblePast).map((event, idx) => {
                const isLastVisible = idx === visiblePast - 1;
                return (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.3 }}
                    ref={isLastVisible ? pastLastCardRef : null}
                  >
                    <EventCard event={event} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {pastEvents.length > 3 && (
            <div className="event-button-group">
              {visiblePast < pastEvents.length ? (
                <button
                  onClick={() => {
                    setVisiblePast(prev => {
                      const newCount = prev + 3;
                      setTimeout(() => handleScroll("more", null, pastLastCardRef), 300);
                      return newCount;
                    });
                  }}
                  className="event-toggle-btn"
                >
                  Load More
                </button>
              ) : (
                <button
                  onClick={() => {
                    setVisiblePast(3);
                    setTimeout(() => handleScroll("less", pastRef), 300);
                  }}
                  className="event-toggle-btn"
                >
                  Show Less
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {location.pathname !== "/home" && <Footer />}
    </>
  );
};

export default EventList;