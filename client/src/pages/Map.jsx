import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import maplibregl from "maplibre-gl";
import axios from "axios";
import "maplibre-gl/dist/maplibre-gl.css";
import Navbar from "../components/Navbar";

const Map = () => {
  const { isAdmin, userType } = useContext(AppContent);
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [activeMarkerId, setActiveMarkerId] = useState(null);

  // Default view
  const DEFAULT_CENTER = [121.0437, 14.676];
  const DEFAULT_ZOOM = 12;

  useEffect(() => {
    if (isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  // Sidebar default (desktop open, mobile closed)
  useEffect(() => {
    const setInitialSidebar = () => setIsSidebarOpen(window.innerWidth >= 768);
    setInitialSidebar();
    window.addEventListener("resize", setInitialSidebar);
    return () => window.removeEventListener("resize", setInitialSidebar);
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  const clearMarkers = () => {
    markers.forEach((m) => m.remove());
    setMarkers([]);
  };

  // ✅ Auto-fit all events
  const resetMapView = () => {
    if (!mapRef.current) return;

    if (events.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      events.forEach((e) => {
        const normalized = normalizeCoordinates(e.coordinates);
        if (normalized) bounds.extend(normalized);
      });

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
        });
        return;
      }
    }

    // fallback if no events
    mapRef.current.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      speed: 1.2,
    });
  };

  // ✅ Smooth transition function
  const flySmoothTo = (coords) => {
    if (!mapRef.current || !coords) return;

    // Step 1: zoom out slightly
    mapRef.current.flyTo({
      center: coords,
      zoom: 13,
      speed: 0.8,
      essential: true,
    });

    // Step 2: zoom in closer
    setTimeout(() => {
      mapRef.current.flyTo({
        center: coords,
        zoom: 15,
        speed: 1.2,
        essential: true,
      });
    }, 600);
  };

  // Normalize coordinates
  const normalizeCoordinates = (coords) => {
    if (!coords) return null;
    let lng, lat;
    if (Array.isArray(coords)) {
      [lng, lat] = coords.map((v) => (typeof v === "string" ? Number(v) : v));
    } else if (typeof coords === "string") {
      const parts = coords.split(",").map((v) => Number(v.trim()));
      [lng, lat] = parts;
    } else if (typeof coords === "object") {
      lat = coords.lat ?? coords.latitude;
      lng = coords.lng ?? coords.longitude;
    }
    if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
    if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180) {
      const maybeLat = lng;
      const maybeLng = lat;
      lng = maybeLng;
      lat = maybeLat;
    }
    return [lng, lat];
  };

  // Mobile bottom sheet
  const showBottomSheet = (event) => {
    setSelectedEvent(event);
    setIsSidebarOpen(false);
  };

  const addMarkers = (eventsToShow) => {
    clearMarkers();
    const newMarkers = [];

    eventsToShow.forEach((event) => {
      const normalized = normalizeCoordinates(event.coordinates);
      if (normalized) {
        // default pin marker
        const marker = new maplibregl.Marker({
          color: event._id === activeMarkerId ? "#2563eb" : "#FF0000", // blue if active, red otherwise
        })
          .setLngLat(normalized)
          .addTo(mapRef.current);

        marker.getElement().classList.add("map-pin");

        // add bounce if active
        if (event._id === activeMarkerId) {
          marker.getElement().classList.add("bounce-pin");
        }

        marker.getElement().addEventListener("click", () => {
          setSelectedEvent(event);
          setActiveMarkerId(event._id); // highlight this pin
          const mobile = window.innerWidth < 768;
          if (mobile) {
            showBottomSheet(event);
          } else {
            setIsSidebarOpen(true);
          }
          flySmoothTo(normalized);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("/api/events");
        const eventsData = response.data.events.filter(
          (e) => e.status !== "cancelled"
        );

        const currentDate = new Date();
        let upcomingEvents = eventsData.filter(
          (e) => new Date(e.date) >= currentDate
        );

        if (userType === "professional") {
          upcomingEvents = upcomingEvents.filter(
            (e) => e.eventTarget === "Professional" || e.eventTarget === "Both"
          );
        } else if (userType === "student") {
          upcomingEvents = upcomingEvents.filter(
            (e) => e.eventTarget === "Student" || e.eventTarget === "Both"
          );
        }

        const mapEvents = upcomingEvents.filter(
          (e) => e.eventType?.toLowerCase() !== "webinar"
        );

        setEvents(mapEvents);
        addMarkers(mapEvents);
      } catch (error) {
        console.error("Failed to fetch events", error);
      }
    };
    fetchEvents();
  }, [userType]);

  const eventsFiltered = events.filter((event) => {
    const matchesSearch = searchQuery
      ? event.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesDate = selectedDate
      ? new Date(event.date).toISOString().split("T")[0] === selectedDate
      : true;
    return matchesSearch && matchesDate;
  });

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setActiveMarkerId(event._id); // highlight marker
    const mobile = window.innerWidth < 768;
    if (mobile) {
      showBottomSheet(event);
    } else {
      setIsSidebarOpen(true);
    }

    const normalized = normalizeCoordinates(event.coordinates);
    if (!normalized) return;
    flySmoothTo(normalized);
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <div className="relative flex-1 w-full overflow-hidden">
        {/* Map */}
        <div
          ref={mapContainerRef}
          className="absolute top-0 left-0 w-full h-full z-10"
        />

        {/* Overlay - only desktop */}
        {isSidebarOpen && window.innerWidth >= 768 && (
          <div
            className="absolute inset-0 bg-black bg-opacity-30 z-15"
            onClick={() => {
              setIsSidebarOpen(false);
              setSelectedEvent(null);
              setActiveMarkerId(null);
              resetMapView(); // ✅ zoom out to all markers
            }}
          ></div>
        )}

        {/* Sidebar (desktop) */}
        <div
          className={`absolute top-0 left-0 h-full w-80 md:w-96 bg-white shadow-xl transform transition-transform duration-300 z-20 flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Toggle button (desktop only) */}
          <button
            className="hidden md:flex absolute top-1/2 right-0 transform translate-x-full -translate-y-1/2 bg-white border shadow-md px-2 py-1 rounded-r-lg z-30 hover:bg-gray-100"
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              if (isSidebarOpen) {
                setSelectedEvent(null);
                setActiveMarkerId(null);
                resetMapView(); // ✅ zoom out
              }
            }}
          >
            {isSidebarOpen ? "⮜" : "⮞"}
          </button>

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-sm">
            {selectedEvent && window.innerWidth >= 768 ? (
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setActiveMarkerId(null);
                  resetMapView(); // ✅ zoom out
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg transition"
              >
                ← Back
              </button>
            ) : (
              <h2 className="text-lg font-semibold text-gray-800">
                Event List
              </h2>
            )}
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setSelectedEvent(null);
                setActiveMarkerId(null);
                resetMapView(); // ✅ zoom out
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
            >
              Close
            </button>
          </div>

          {/* Event list or details (desktop) */}
          {!selectedEvent || window.innerWidth < 768 ? (
            <>
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 space-y-3">
                <input
                  type="text"
                  placeholder="🔍 Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Dates</option>
                  {[...new Set(events.map((e) => e.date.split("T")[0]))].map(
                    (date) => (
                      <option key={date} value={date}>
                        {new Date(date).toDateString()}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Event list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {eventsFiltered.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No events found matching your search
                  </p>
                ) : (
                  eventsFiltered.map((event) => (
                    <div
                      key={event._id}
                      className="flex flex-col bg-white border rounded-xl shadow hover:shadow-md hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <img
                        src={event.image || "/placeholder.jpg"}
                        alt={event.title}
                        className="w-full h-40 object-cover rounded-t-xl"
                      />
                      <div className="p-3 space-y-1">
                        <h3 className="font-semibold text-gray-800 text-base truncate">
                          {event.title || "Untitled Event"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          📍 {event.location || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          📅{" "}
                          {event.date
                            ? new Date(event.date).toDateString()
                            : "No date"}{" "}
                          • ⏰ {event.time || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // Desktop details
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedEvent.title || "Untitled Event"}
              </h3>
              <img
                src={selectedEvent.image || "/placeholder.jpg"}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover rounded-lg shadow mb-3"
              />
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <p>
                  <strong>📍 Location:</strong>{" "}
                  {selectedEvent.location || "Unknown"}
                </p>
                <p>
                  <strong>📅 Date:</strong>{" "}
                  {selectedEvent.date
                    ? new Date(selectedEvent.date).toLocaleDateString()
                    : "No date"}
                </p>
                <p>
                  <strong>⏰ Time:</strong> {selectedEvent.time || "N/A"}
                </p>
                <p>
                  <strong>🎟 Type:</strong>{" "}
                  {selectedEvent.eventType || "General"}
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedEvent.about || "No description available"}
              </p>

              {/* Navigate button on desktop */}
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mt-4"
                onClick={() => {
                  const normalized = normalizeCoordinates(
                    selectedEvent.coordinates
                  );
                  if (normalized) {
                    const [lng, lat] = normalized;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                      "_blank"
                    );
                  }
                }}
              >
                Navigate
              </button>
            </div>
          )}
        </div>

        {/* Mobile bottom sheet */}
        {selectedEvent && window.innerWidth < 768 && (
          <div className="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up max-h-[75vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedEvent.title || "Untitled Event"}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => {
                    setSelectedEvent(null);
                    setActiveMarkerId(null);
                    resetMapView(); // ✅ zoom out
                  }}
                >
                  ✕
                </button>
              </div>
              <img
                src={selectedEvent.image || "/placeholder.jpg"}
                alt={selectedEvent.title}
                className="w-full h-40 object-cover rounded-lg mt-3"
              />
              <div className="mt-3 space-y-2 text-sm">
                <p>📍 {selectedEvent.location || "Unknown"}</p>
                <p>
                  📅{" "}
                  {selectedEvent.date
                    ? new Date(selectedEvent.date).toDateString()
                    : "No date"}{" "}
                  • ⏰ {selectedEvent.time || "N/A"}
                </p>
                <p>🎟 {selectedEvent.eventType || "General"}</p>
              </div>
              <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                {selectedEvent.about || "No description available"}
              </p>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mt-4"
                onClick={() => {
                  const normalized = normalizeCoordinates(
                    selectedEvent.coordinates
                  );
                  if (normalized) {
                    const [lng, lat] = normalized;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                      "_blank"
                    );
                  }
                }}
              >
                Navigate
              </button>
            </div>
          </div>
        )}

        {/* Mobile sidebar toggle (hidden if bottom sheet is open) */}
        {!selectedEvent && (
          <button
            className="fixed bottom-20 left-6 md:hidden bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Map;
