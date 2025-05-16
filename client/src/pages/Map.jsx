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
  const [selectedEvent, setSelectedEvent] = useState(null); // NEW: Track clicked event

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

        // Add markers to map
        eventsData.forEach((event) => {
          if (event.coordinates && event.coordinates.length === 2) {
            const marker = new maplibregl.Marker({ color: "#FF0000" })
              .setLngLat(event.coordinates)
              .addTo(mapRef.current);

            // Set popup with a simple click
            marker.getElement().addEventListener("click", () => {
              setSelectedEvent(event); // 👈 when clicking, show this event card

              mapRef.current.flyTo({
                center: event.coordinates, // focus on this event
                zoom: 15, // zoom in closer
                speed: 1.2, // smooth animation
                curve: 1,
                essential: true,
              });
            });
          }
        });
      } catch (error) {
        console.error("Failed to fetch events", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <Navbar />
      <div className="cpemap-wrapper">
        <div ref={mapContainerRef} className="cpemap-map" />

        {selectedEvent && (
          <div className="cpemap-event-card">
            <button
              className="cpemap-close-btn"
              onClick={() => {
                setSelectedEvent(null); // hide card
                mapRef.current.flyTo({
                  center: [121.0437, 14.676], // default center
                  zoom: 12, // zoom out
                  speed: 1.2,
                  curve: 1,
                  essential: true,
                });
              }}
            >
              ❌
            </button>

            <div className="cpemap-event-graphic">
                <img
                    src={selectedEvent.imageUrl || "/placeholder.jpg"}
                    alt={selectedEvent.title}
                    className="cpemap-event-image"
                />
            </div>

            <div className="cpemap-event-info">
              <p className="cpemap-event-time">
                {new Date(selectedEvent.date).toDateString()} •{" "}
                {selectedEvent.time}
              </p>
              <p className="cpemap-event-title">{selectedEvent.title}</p>
              <p className="cpemap-event-location">
                📍 {selectedEvent.location}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Map;
