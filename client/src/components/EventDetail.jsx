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
  const [loadingAction, setLoadingAction] = useState(null);
  const { backendUrl } = useContext(AppContent);

  const renderActionButtons = () => (
    <div
      className="event-actions flex flex-col gap-2"
      role="group"
      aria-label="Event actions"
    >
      {/* Register Button */}
      <button
        onClick={async () => {
          if (loadingAction) return; // prevent double click
          setLoadingAction("register");

          try {
            if (isRegistered) {
              Swal.fire({
                icon: "info",
                title: "You're already registered!",
                text: "You have already booked this event.",
                confirmButtonColor: "#2563EB",
              });
              return;
            }

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

            const res = await axios.get(
              `${backendUrl}/api/events/${event._id}/check-sameday`,
              { withCredentials: true }
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
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Could not verify registration status. Please try again later.",
              confirmButtonColor: "#2563EB",
            });
          } finally {
            setLoadingAction(null);
          }
        }}
        className={`w-full rounded-full font-semibold text-lg py-3 flex justify-center items-center gap-2 transition 
      ${
        isRegistered || isPastEvent
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
      }`}
        disabled={isRegistered || isPastEvent || loadingAction === "register"}
      >
        {loadingAction === "register" && (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        )}
        {loadingAction === "register"
          ? "Processing..."
          : isRegistered
          ? "Already Registered"
          : isPastEvent
          ? "Event Ended"
          : "Book Now"}
      </button>

      {/* Calendar Button */}
      {!isPastEvent && (
        <button
          onClick={() => {
            if (loadingAction) return;
            setLoadingAction("calendar");
            setTimeout(() => {
              window.open(createGoogleCalendarLink(event), "_blank");
              setLoadingAction(null);
            }, 1000);
          }}
          className="calendar-button w-full rounded-full font-semibold text-lg py-3 flex justify-center items-center gap-2 bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-md transition"
          type="button"
          disabled={loadingAction === "calendar"}
        >
          {loadingAction === "calendar" && (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {loadingAction === "calendar"
            ? "Opening..."
            : "Add to Google Calendar"}
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

  if (loading || !event)
    return (
      <div className="loading flex justify-center items-center min-h-[400px] text-xl text-blue-600">
        Loading...
      </div>
    );
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

      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {/* Mobile Title */}
          <div className="block md:hidden mt-1 px-2 mb-4">
            <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 text-center">
              <h1
                className="text-3xl sm:text-4xl font-extrabold leading-tight 
                 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 
                 bg-clip-text text-transparent drop-shadow-sm"
              >
                {event.title}
              </h1>
              <p className="text-sm sm:text-base mt-1 text-gray-700 font-semibold italic">
                {event.category}
              </p>
            </div>
          </div>

          {/* Banner */}
          <div className="event-banner relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-[250px] sm:h-[400px] md:h-[700px] object-cover brightness-90"
            />

            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-[1]" />

            {/* Price Badge */}
            <span className="absolute top-3 left-3 sm:top-5 sm:left-5 bg-white text-blue-600 font-bold text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md z-[3] border border-gray-200">
              ₱{event.price?.toLocaleString() || "Free"}
            </span>

            {/* Date Card Desktop */}
            <div className="hidden md:block absolute top-5 right-5 z-[2] bg-white text-gray-800 p-6 rounded-2xl text-center shadow-xl min-w-[200px]">
              <p className="my-2 text-lg font-medium">
                {new Date(event.date).toDateString()}
              </p>
              <p className="my-2 text-lg font-medium">{event.time}</p>
              {renderActionButtons()}
            </div>

            {/* Title Overlay Desktop */}
            <div className="hidden md:block absolute bottom-8 left-8 z-[2] max-w-[70%]">
              <h1
                className="text-5xl font-extrabold leading-tight 
               bg-gradient-to-r from-blue-300 via-sky-400 to-blue-500 
               bg-clip-text text-transparent drop-shadow-lg"
              >
                {event.title}
              </h1>

              {/* Light blue underline */}
              <div className="w-24 h-1 mt-2 rounded-full bg-gradient-to-r from-blue-300 via-sky-400 to-blue-500"></div>

              {/* Category badge */}
              <p className="inline-block mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-md">
                {event.category}
              </p>
            </div>
          </div>

          {/* Description + Location/Webinar Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {/* Description Card */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed">{event.about}</p>
            </div>

            {/* Location or Webinar Card */}
            {event.eventType === "Webinar" ? (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Webinar Details
                  </h2>
                  <span className="self-start sm:self-auto bg-blue-100 text-blue-700 text-xs sm:text-sm px-3 py-1 rounded-full font-semibold">
                    Online Event
                  </span>
                </div>

                {isRegistered ? (
                  event.webinarLink ? (
                    <a
                      href={event.webinarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-700 break-all mt-3 block"
                    >
                      Join Webinar
                    </a>
                  ) : (
                    <p className="text-gray-500 italic mt-3">
                      The webinar link will be available soon.
                    </p>
                  )
                ) : (
                  <p className="text-gray-500 italic mt-3">
                    You need to register to access the webinar link.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Event Location
                </h2>
                <div
                  ref={mapContainerRef}
                  className="h-[250px] sm:h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 relative"
                >
                  {/* Map Loading/Error */}
                </div>
                <p className="text-gray-600 text-[1.125rem] mt-4">
                  {event.location}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="mobile-action-bar sticky bottom-0 left-0 right-0 bg-white/85 backdrop-saturate-150 backdrop-blur-md p-3 border-t border-gray-200 md:hidden z-10">
        <div className="flex flex-col items-center mb-2">
          <p className="text-sm sm:text-base font-medium text-gray-700">
            {new Date(event.date).toDateString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-600">{event.time}</p>
        </div>
        {renderActionButtons()}
      </div>

      {/* Share This Event */}
      <div className="event-share-section my-12 p-6 md:p-8 bg-gray-50 rounded-2xl shadow-md text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Share This Event
        </h2>
        <div className="share-icons flex justify-center gap-6 text-3xl">
          {/* Facebook */}
          <FaFacebook
            className="share-icon facebook text-[#1877F2] cursor-pointer transition-transform hover:scale-110"
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

          {/* Twitter (kept import & comment per 'don't remove code') */}
          {/* <FaTwitter className="share-icon twitter text-[#1DA1F2]" /> */}

          {/* Copy Link + Details */}
          <FaLink
            className="share-icon copy text-gray-500 cursor-pointer transition-transform hover:scale-110"
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
      <Footer />
    </>
  );
};

export default EventDetail;
