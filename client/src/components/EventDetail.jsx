import React, { useRef, useEffect, useState, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./EventDetail.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const EventDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
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
      }
    };
    fetchEvent();
  }, [id, userData?.id]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !event?.coordinates)
      return;

    const [lng, lat] = event.coordinates;
    if (isNaN(lng) || isNaN(lat)) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj",
      center: [lng, lat],
      zoom: 16,
    });

    const marker = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .setPopup(
        new maplibregl.Popup().setText(event.location || "Event Location")
      )
      .addTo(mapRef.current);

    markerRef.current = marker;
  }, [event]);

  const handleRegister = async () => {
    try {
      const res = await axios.post(
        `/api/events/register/${id}`,
        {
          fullName: userData.fullName,
          userId: userData.id,
          userType: userData.userType,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (res.data.success) {
        setIsRegistered(true);
        alert("Success");
      } else {
        alert(res.data.message || "Failed");
      }
    } catch (err) {
      console.error(
        "Error during registration:",
        err.response?.data || err.message
      );
      alert("Error registration");
    }
  };

  if (loading || !event) return <div className="loading">Loading...</div>;

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
            <div className="event-date-card">
              <p>{new Date(event.date).toDateString()}</p>
              <p>{event.time}</p>
              <button
                onClick={handleRegister}
                disabled={isRegistered}
                className={`register-button ${
                  isRegistered ? "registered" : "not-registered"
                }`}
              >
                {isRegistered ? "Already Registered" : "Book Now"}
              </button>
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