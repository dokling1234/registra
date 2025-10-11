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
import Swal from "sweetalert2";
import { FaFacebook, FaTwitter, FaLink } from "react-icons/fa";
import { Helmet } from "react-helmet";

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(false);
  const { userData, isLoggedin, authLoading } = useContext(AppContent);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { backendUrl } = useContext(AppContent);

  const renderActionButtons = () => (
    <div className="event-actions" role="group" aria-label="Event actions">
      <button
        onClick={async () => {

          if (isRegistered) {
            Swal.fire({
              icon: "info",
              title: "You're already registered!",
              text: "You have already booked this event.",
              confirmButtonColor: "#2563EB",
            });
            return;
          }
          // ✅ Only block if NOT logged in
          if (!isLoggedin) {
            Swal.fire({
              icon: "warning",
              title: "Login Required",
              text: "You must be logged in to register for this event.",
              showCancelButton: true,
              confirmButtonColor: "#2563EB",
              cancelButtonColor: "#9CA3AF",
              confirmButtonText: "Go to Login",
              cancelButtonText: "Cancel",
            }).then((result) => {
              if (result.isConfirmed) navigate("/login");
            });
            return;
          }

          // ✅ If logged in, continue normally
          try {
            const res = await axios.get(
              `${backendUrl}/api/events/${event._id}/check-sameday`,
              {
                withCredentials: true,
              }
            );

            if (!res.data.success) {
              Swal.fire({
                icon: "warning",
                title: "Conflict Detected",
                text:
                  res.data.message || "You already have an event on this date.",
                confirmButtonColor: "#2563EB",
              });
              return;
            }

            Swal.fire({
              title: "Confirm Booking",
              text: "Do you want to book this event?",
              icon: "question",
              showCancelButton: true,
              confirmButtonColor: "#2563EB",
              cancelButtonColor: "#9CA3AF",
              confirmButtonText: "Yes, book it!",
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.fire({
                  title: "Booking Confirmed!",
                  //text: "Redirecting to payment/receipt upload...",
                  icon: "success",
                  timer: 1500,
                  showConfirmButton: false,
                });
                setTimeout(() => {
                  navigate(`/uploadreceipt/${id}`);
                }, 1500);
              }
            });
          } catch (err) {
            console.error("Error checking same-day:", err);

            if (err.response?.status === 401) {
              // Backend says unauthorized
              Swal.fire({
                icon: "warning",
                title: "Session Expired",
                text: "Please log in again to continue.",
                showCancelButton: true,
                confirmButtonColor: "#2563EB",
                cancelButtonColor: "#9CA3AF",
                confirmButtonText: "Go to Login",
                cancelButtonText: "Cancel",
              }).then((result) => {
                if (result.isConfirmed) {
                  navigate("/login");
                }
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "Could not verify registration status. Please try again later.",
                confirmButtonColor: "#2563EB",
              });
            }
          }
        }}
        className={`register-button ${
          isRegistered ? "registered" : "not-registered"
        }`}
        aria-label={isRegistered ? "Already registered" : "Book now"}
        disabled={isRegistered || isPastEvent}
      >
        {isRegistered
          ? "Already Registered"
          : isPastEvent
          ? "Event Ended"
          : "Book Now"}
      </button>

      {!isPastEvent && (
        <button
          onClick={() => window.open(createGoogleCalendarLink(event), "_blank")}
          className="calendar-button"
          aria-label="Add to Google Calendar"
          type="button"
        >
          Add to Google Calendar
        </button>
      )}
    </div>
  );

  const createGoogleCalendarLink = (event) => {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2-hour duration

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, "");

    const details = encodeURIComponent(event.about || "");
    const location = encodeURIComponent(event.location || "");
    const title = encodeURIComponent(event.title);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(
      startDate
    )}/${formatDate(
      endDate
    )}&details=${details}&location=${location}&sf=true&output=xml`;
  };
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

      mapRef.current.on("load", () => {
        setMapLoading(false);

        // Add marker after map loads
        const marker = new maplibregl.Marker({ color: "#FF0000" })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup().setText(event.location || "Event Location")
          )
          .addTo(mapRef.current);

        markerRef.current = marker;
      });

      mapRef.current.on("error", (e) => {
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
      <Helmet>
        <title>{event.title}</title>
        <meta property="og:title" content={event.title} />
        <meta
          property="og:description"
          content={event.about?.slice(0, 150) || "Check out this event!"}
        />
        <meta
          property="og:image"
          content={
            event.image?.startsWith("http")
              ? event.image
              : `${window.location.origin}${event.image}`
          }
        />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Helmet>

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
              {renderActionButtons()}
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
              <div ref={mapContainerRef} className="event-map-container">
                {mapLoading && (
                  <div className="map-loading" role="status" aria-live="polite">
                    <div className="loading-spinner" />
                    <p>Loading map…</p>
                  </div>
                )}
                {mapError && (
                  <div className="map-error" role="alert">
                    <p>We couldn’t load the map right now.</p>
                    {Array.isArray(event?.coordinates) && (
                      <>
                        <p className="map-fallback-text">
                          Here are the coordinates you can use:
                        </p>
                        <p className="map-coordinates">{`${event.coordinates[1]}, ${event.coordinates[0]}`}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p>{event.location}</p>
            </div>
          </div>
        </div>
        {/* Mobile sticky action bar */}
        <div className="mobile-action-bar" aria-hidden={false}>
          {renderActionButtons()}
        </div>
        {/* Share This Event */}
        <div className="event-share-section">
          <h2>Share This Event</h2>
          <div className="share-icons">
            {/* Facebook */}
            <FaFacebook
              className="share-icon facebook"
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}&quote=${encodeURIComponent(
                    `${event.title} - ${event.about}\nDate: ${new Date(
                      event.date
                    ).toDateString()}`
                  )}`,
                  "_blank"
                )
              }
            />

            {/* Twitter */}

            {/* Copy Link + Details */}
            <FaLink
              className="share-icon copy"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                Swal.fire({
                  icon: "success",
                  title: "Link copied!",
                  text: "Event link has been copied to your clipboard.",
                  showConfirmButton: false,
                  timer: 1500,
                });
              }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EventDetail;
