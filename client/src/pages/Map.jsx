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
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const locationDropdownRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const selectedEventRef = useRef(null);
  const [markers, setMarkers] = useState([]);

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

  // Scroll to selected event when it changes
  useEffect(() => {
    if (selectedEvent && selectedEventRef.current) {
      selectedEventRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedEvent]);

  // Clear existing markers
  const clearMarkers = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  };

  // Add markers for events
  const addMarkers = (eventsToShow) => {
    const newMarkers = [];
    eventsToShow.forEach((event) => {
      if (event.coordinates && event.coordinates.length === 2) {
        const marker = new maplibregl.Marker({ color: "#FF0000" })
          .setLngLat(event.coordinates)
          .addTo(mapRef.current);

        const markerElement = marker.getElement();
        markerElement.style.cursor = "pointer";

        markerElement.addEventListener("click", () => {
          setSelectedEvent(event);
          setIsSidebarOpen(true);
          setIsDetailsVisible(true);
          mapRef.current.flyTo({
            center: event.coordinates,
            zoom: 15,
            speed: 1.2,
            curve: 1,
            essential: true,
          });
        });

        newMarkers.push(marker);
      }
    });
    setMarkers(newMarkers);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("/api/events");
        const eventsData = response.data.events;
        
        // Filter out past events
        const currentDate = new Date();
        const upcomingEvents = eventsData.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= currentDate;
        });
        
        setEvents(upcomingEvents);
        addMarkers(upcomingEvents);

        console.log("Upcoming events fetched successfully", upcomingEvents);
      } catch (error) {
        console.error("Failed to fetch events", error);
      }
    };

    fetchEvents();
  }, []);

  // Get unique locations from events
  const uniqueLocations = [...new Set(events.map(event => event.location))].filter(Boolean);

  // Filter locations based on search query
  const filteredLocations = uniqueLocations.filter(location =>
    location.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationDropdownOpen(false);
    setLocationSearchQuery("");
  };

  // Get unique dates from events
  const uniqueDates = [...new Set(events.map(event => {
    const date = new Date(event.date);
    return date.toISOString().split('T')[0];
  }))].sort();

  const filteredEvents = events.filter((event) => {
    const matchesSearch = searchQuery
      ? event.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesLocation = selectedLocation
      ? event.location === selectedLocation
      : true;
    
    const matchesDate = selectedDate
      ? new Date(event.date).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesLocation && matchesDate;
  });

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsSidebarOpen(true);
    setIsDetailsVisible(true);
    mapRef.current.flyTo({
      center: event.coordinates,
      zoom: 15,
      speed: 1.2,
      curve: 1,
      essential: true,
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedEvent(null);
    setIsDetailsVisible(false);
    mapRef.current.flyTo({
      center: [121.0437, 14.676],
      zoom: 12,
      speed: 1.2,
      curve: 1,
      essential: true,
    });
  };

  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("");
    setSelectedDate("");
  };

  return (
    <>
      <Navbar />
      
        <div className="cpemap-wrapper">
          {/* Event Details Container */}
          <div className={`cpemap-event-details-container ${isDetailsVisible ? 'visible' : ''}`}>
            {selectedEvent && (
              <>
                <div className="cpemap-event-details-header">
                  <h3>{selectedEvent.title}</h3>
                  <button className="cpemap-event-details-close" onClick={handleCloseDetails}>
                    ✕
                  </button>
                </div>
                <div className="cpemap-event-details-content">
                  <img
                    src={selectedEvent.image || "/placeholder.jpg"}
                    alt={selectedEvent.title}
                    className="cpemap-event-details-image"
                  />
                  <div className="cpemap-event-details-info">
                    <p>
                      <strong>Location:</strong>
                      <span>{selectedEvent.location}</span>
                    </p>
                    <p>
                      <strong>Date:</strong>
                      <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </p>
                    <p>
                      <strong>Time:</strong>
                      <span>{selectedEvent.time}</span>
                    </p>
                    <p>
                      <strong>Type:</strong>
                      <span>{selectedEvent.eventType || 'Not specified'}</span>
                    </p>
                    <p>
                      <strong>Description:</strong>
                      <span>{selectedEvent.about || 'No description available'}</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`cpemap-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
            <button
              className="cpemap-sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? "◀" : "▶"}
            </button>
            <div className="cpemap-sidebar-content">
              <div className="cpemap-sidebar-header">
                <h2>Event Details</h2>
                <button className="cpemap-close-button" onClick={handleCloseSidebar}>
                  ✕
                </button>
              </div>
              <div className="cpemap-search">
                <div className="cpemap-search-filters">
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="cpemap-search-input"
                  />
                  <div className="cpemap-location-dropdown" ref={locationDropdownRef}>
                    <div 
                      className="cpemap-location-select"
                      onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    >
                      <span>{selectedLocation || "Select Location"}</span>
                      <span className="cpemap-dropdown-arrow">▼</span>
                    </div>
                    {isLocationDropdownOpen && (
                      <div className="cpemap-location-dropdown-content">
                        <div className="cpemap-location-search">
                          <input
                            type="text"
                            placeholder="Search locations..."
                            value={locationSearchQuery}
                            onChange={(e) => setLocationSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="cpemap-location-search-input"
                          />
                        </div>
                        <div className="cpemap-location-list">
                          {filteredLocations.length > 0 ? (
                            filteredLocations.map((location) => (
                              <div
                                key={location}
                                className={`cpemap-location-item ${
                                  selectedLocation === location ? "selected" : ""
                                }`}
                                onClick={() => handleLocationSelect(location)}
                              >
                                {location}
                              </div>
                            ))
                          ) : (
                            <div className="cpemap-no-locations">
                              No locations found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <select
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="cpemap-search-select"
                  >
                    <option value="">All Dates</option>
                    {uniqueDates.map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </option>
                    ))}
                  </select>
                  {(searchQuery || selectedLocation || selectedDate) && (
                    <button
                      onClick={handleClearFilters}
                      className="cpemap-clear-filters"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              <div className="cpemap-events-list">
                {filteredEvents.length === 0 ? (
                  <div className="cpemap-no-results">
                    No events found matching your search
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event._id}
                      ref={selectedEvent?._id === event._id ? selectedEventRef : null}
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
                  ))
                )}
              </div>
            </div>
          </div>

          <div ref={mapContainerRef} className="cpemap-map" />
        </div>
      
    </>
  );
};

export default Map;