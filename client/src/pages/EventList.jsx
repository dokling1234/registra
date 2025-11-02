import React, { useContext, useEffect, useRef, useState } from "react";
import EventCard from "../components/EventCard";
import Navbar from "../components/Navbar";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Footer from "../components/Footer";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
    eventType: "",
    location: "",
    date: "",
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
        filtered = filtered.filter((event) => event.status !== "cancelled");

        if (appliedFilters.eventType) {
          filtered = filtered.filter(
            (e) =>
              e.eventType?.toLowerCase() ===
              appliedFilters.eventType.toLowerCase()
          );
        }
        if (appliedFilters.location) {
          filtered = filtered.filter((e) =>
            e.location
              ?.toLowerCase()
              .includes(appliedFilters.location.toLowerCase())
          );
        }
        if (appliedFilters.startDate || appliedFilters.endDate) {
          filtered = filtered.filter((e) => {
            const eventDate = new Date(e.date);
            const start = appliedFilters.startDate
              ? new Date(appliedFilters.startDate)
              : null;
            const end = appliedFilters.endDate
              ? new Date(appliedFilters.endDate)
              : null;

            if (start && end) return eventDate >= start && eventDate <= end;
            if (start) return eventDate >= start;
            if (end) return eventDate <= end;
            return true;
          });
        }

        const currentDate = new Date();
        const upcoming = filtered.filter(
          (event) => new Date(event.date) >= currentDate
        );
        const past = filtered.filter(
          (event) => new Date(event.date) < currentDate
        );

        setEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        console.error(
          "Error fetching events:",
          err.response?.data || err.message
        );
      }
    };

    if (userData?.userType) {
      fetchEvents();
    }
  }, [userData, appliedFilters]);

  const handleScroll = (type, ref, cardRef = null) => {
    const offset = 80;

    if (type === "less" && ref?.current) {
      window.scrollTo({
        top: ref.current.offsetTop - offset,
        behavior: "smooth",
      });
    } else if (type === "more" && cardRef?.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const targetTop = rect.top + scrollTop - offset;
      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {location.pathname !== "/home" && <Navbar />}

      {/* ✅ Bigger Container with gradient background */}
      <div className="w-full max-w-screen-3xl mx-auto my-8 sm:my-16 px-4 sm:px-10 lg:px-14 py-8 sm:py-14 bg-gradient-to-tr from-blue-50 via-white to-blue-100 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl">
        <div className="flex flex-col items-center">
          {events.length === 0 && pastEvents.length === 0 ? (
            <p className="text-center text-gray-500 italic text-base sm:text-lg my-6 sm:my-10">
              No events found
            </p>
          ) : (
            <>
              {/* Upcoming Events */}
              <h2
                className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 mb-6 sm:mb-8 drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                ref={upcomingRef}
              >
                Upcoming <span className="text-blue-600">Events</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 w-full">
                <AnimatePresence>
                  {events.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 italic">
                      No upcoming events
                    </p>
                  ) : (
                    events.slice(0, visibleUpcoming).map((event, idx) => {
                      const isLastVisible = idx === visibleUpcoming - 1;
                      return (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.25 }}
                          ref={isLastVisible ? upcomingLastCardRef : null}
                          className="h-full"
                        >
                          <EventCard event={event} />
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {events.length > 3 && (
                <div className="flex justify-center mt-5 sm:mt-8">
                  {visibleUpcoming < events.length ? (
                    <button
                      onClick={() => {
                        setVisibleUpcoming((prev) => {
                          const newCount = prev + 3;
                          setTimeout(
                            () =>
                              handleScroll("more", null, upcomingLastCardRef),
                            300
                          );
                          return newCount;
                        });
                      }}
                      className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md text-sm sm:text-base transition"
                    >
                      Load More
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setVisibleUpcoming(3);
                        setTimeout(
                          () => handleScroll("less", upcomingRef),
                          300
                        );
                      }}
                      className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md text-sm sm:text-base transition"
                    >
                      Show Less
                    </button>
                  )}
                </div>
              )}

              {/* Past Events */}
              <h2
                className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 mt-12 sm:mt-20 mb-6 sm:mb-8 border-t pt-6 sm:pt-10 drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                ref={pastRef}
              >
                Past <span className="text-blue-600">Events</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 w-full">
                <AnimatePresence>
                  {pastEvents.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 italic">
                      No past events
                    </p>
                  ) : (
                    pastEvents.slice(0, visiblePast).map((event, idx) => {
                      const isLastVisible = idx === visiblePast - 1;
                      return (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.25 }}
                          ref={isLastVisible ? pastLastCardRef : null}
                          className="h-full"
                        >
                          <EventCard event={event} />
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {pastEvents.length > 3 && (
                <div className="flex justify-center mt-5 sm:mt-8 mb-6 sm:mb-12">
                  {visiblePast < pastEvents.length ? (
                    <button
                      onClick={() => {
                        setVisiblePast((prev) => {
                          const newCount = prev + 3;
                          setTimeout(
                            () => handleScroll("more", null, pastLastCardRef),
                            300
                          );
                          return newCount;
                        });
                      }}
                      className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md text-sm sm:text-base transition"
                    >
                      Load More
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setVisiblePast(3);
                        setTimeout(() => handleScroll("less", pastRef), 300);
                      }}
                      className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md text-sm sm:text-base transition"
                    >
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {location.pathname !== "/home" && <Footer />}
    </>
  );
};

export default EventList;
