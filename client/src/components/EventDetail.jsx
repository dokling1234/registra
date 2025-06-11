import React, { useRef, useEffect, useState, useContext } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./EventDetail.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(false);
  const { userData } = useContext(AppContent);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        setEvent(res.data.event);
        const registered = res.data.event.registrations.some(
          (r) => r.userId === userData?.id
        );
        setIsRegistered(registered);
        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to fetch event:",
          err.response?.data || err.message
        );
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, userData?.id]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !event?.coordinates) {
      return;
    }

    const [lng, lat] = event.coordinates;
    if (isNaN(lng) || isNaN(lat)) {
      console.error("Invalid coordinates:", event.coordinates);
      setMapError(true);
      return;
    }

    setMapLoading(true);
    setMapError(false);

    try {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style:
          "https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj",
        center: [lng, lat],
        zoom: 16,
        attributionControl: false, // Disable attribution for cleaner look
      });

      mapRef.current.on('load', () => {
        setMapLoading(false);
        
        // Add marker after map loads
        const marker = new maplibregl.Marker({ color: '#FF0000' })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup().setText(event.location || "Event Location")
          )
          .addTo(mapRef.current);

        markerRef.current = marker;
      });

      mapRef.current.on('error', (e) => {
        console.error("Map error:", e);
        setMapError(true);
        setMapLoading(false);
      });

    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(true);
      setMapLoading(false);
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [event]);

  if (loading || !event) return <div className="loading">Loading...</div>;
  const isPastEvent = new Date(event.date) < new Date();

  return (
    <>
      {location.pathname !== "/home" && <Navbar />}
      <div className="container">
        <div className="event-detail-page">
          {/* Banner */}
          <div className="event-banner">
            <img
              src={event.image}
              alt={event.title}
              className="event-banner-img"
            />
            <span className="event-detail-price-badge">
              ₱{event.price?.toLocaleString() || "Free"}
            </span>
            <div className="event-date-card">
              <p>{new Date(event.date).toDateString()}</p>
              <p>{event.time}</p>
              {!isPastEvent && (
                <button
                  onClick={() => navigate(`/uploadreceipt/${id}`)}
                  disabled={isRegistered}
                  className={`register-button ${
                    isRegistered ? "registered" : "not-registered"
                  }`}
                >
                  {isRegistered ? "Already Registered" : "Book Now"}
                </button>
              )}
            </div>
            <div className="event-banner-text">
              <h1>{event.title}</h1>
              <p>{event.category}</p>
            </div>
          </div>

          {/* Description and Location */}
          <div className="event-main-content">
            <div className="event-description">
              <h2>Description</h2>
              <p>{event.about}</p>
            </div>

            <div className="event-location-card">
              <h2>Event Location</h2>
              <div ref={mapContainerRef} className="event-map-container" />
              <p>{event.location}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EventDetail;
