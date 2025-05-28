import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import axios from "axios";
import "maplibre-gl/dist/maplibre-gl.css";
import "./Map.css";
import Navbar from "../components/Navbar";

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Disable scroll only on this page
  useEffect(() => {
    document.body.style.overflow = "hidden"; // Disable scrolling

    return () => {
      document.body.style.overflow = ""; // Re-enable scrolling on unmount
    };
  }, []);
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj",
      center: [121.0437, 14.676],
      zoom: 12,
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("/api/events");
        const eventsData = response.data.events;
        setEvents(eventsData);
        const currentDate = new Date();
        const upcomingEvents = eventsData.filter(
          (event) => new Date(event.date) >= currentDate
        );
        setEvents(upcomingEvents);

        const bounds = new maplibregl.LngLatBounds();

        upcomingEvents.forEach((event) => {
          if (event.coordinates && event.coordinates.length === 2) {
            const marker = new maplibregl.Marker({ color: "#FF0000" })
              .setLngLat(event.coordinates)
              .addTo(mapRef.current);
            bounds.extend(event.coordinates);

            const markerElement = marker.getElement();
            markerElement.style.cursor = "pointer";

            markerElement.addEventListener("click", () => {
              setSelectedEvent(event);
              mapRef.current.flyTo({
                center: event.coordinates,
                zoom: 15,
                speed: 1.2,
                curve: 1,
                essential: true,
              });
            });
          }
        });

        if (!bounds.isEmpty()) {
          mapRef.current.fitBounds(bounds, {
            padding: 60,
            duration: 1000,
          });
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      }
    };

    fetchEvents();
  }, []);
  console.log("All events:", events);

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    mapRef.current.flyTo({
      center: event.coordinates,
      zoom: 15,
      speed: 1.2,
      curve: 1,
      essential: true,
    });
  };

  return (
    <>
      <Navbar />
      <body className="no-scroll">
        <div className="cpemap-wrapper">
          <div
            className={`cpemap-sidebar ${isSidebarOpen ? "open" : "closed"}`}
          >
            <button
              className="cpemap-sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? "◀" : "▶"}
            </button>
            <div className="cpemap-sidebar-content">
              <div className="cpemap-search">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cpemap-search-input"
                />
              </div>
              <div className="cpemap-events-list">
                {filteredEvents.map((event) => (
                  <div
                    key={event._id}
                    className={`cpemap-event-item ${
                      selectedEvent?._id === event._id ? "selected" : ""
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    <img
                      src={event.image || "/placeholder.jpg"}
                      alt={event.title}
                      className="cpemap-event-thumbnail"
                    />
                    <div className="cpemap-event-item-info">
                      <h3>{event.title}</h3>
                      <p>{event.location}</p>
                      <p>
                        {new Date(event.date).toDateString()} • {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div ref={mapContainerRef} className="cpemap-map" />
        </div>
      </body>
    </>
  );
};

export default Map;
