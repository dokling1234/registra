import React from "react";
import { Link } from "react-router-dom";
import "./EventCard.css";

const EventCard = ({ event }) => {
  const placeholderImage = "/placeholder.jpg";

  const DateIcon = (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="#2563eb"
        strokeWidth="2"
      />
      <path
        d="M16 3v4M8 3v4"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M3 9h18" stroke="#2563eb" strokeWidth="2" />
    </svg>
  );

  const LocationIcon = (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
    >
      <path
        d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"
        stroke="#2563eb"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="12" cy="11" r="2" stroke="#2563eb" strokeWidth="2" />
    </svg>
  );

  return (
    <Link to={`/events/${event._id}`} className="event-card-link">
      <div className="event-card">
        <div className="event-card-image-container">
          <img
            src={event.image || placeholderImage}
            alt={event.title}
            className="event-card-image"
          />
          <span className="event-card-price-badge">
            ₱{event.price?.toLocaleString() || 'Free'}
          </span>
        </div>
        <div className="event-card-content">
          <h3 className="event-card-title">{event.title}</h3>
          <p className="event-card-date">
            {DateIcon}
            {new Date(event.date).toLocaleDateString()}
          </p>
          <p className="event-card-location">
            {LocationIcon}
            {event.location}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
