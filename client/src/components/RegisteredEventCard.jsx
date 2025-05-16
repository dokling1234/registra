import React from "react";
import { Link } from "react-router-dom";
import "./RegisteredEventCard.css";

const RegisteredEventCard = ({ event }) => {
  const eventDate = new Date(event.date).toLocaleDateString();

  return (
    <Link to={`/events/registered/${event._id}`} className="card-link">
      <div className="card-container">
        <img
          src={event.image || "/placeholder.jpg"}
          alt={event.title}
          className="card-image"
        />

        <div className="card-content">
          <div className="card-date-time">
            {eventDate} • {event.time}
          </div>
          <h3 className="card-title">{event.title}</h3>
          <p className="card-location">{event.location}</p>

          <div className="card-footer">
            <span className="card-price">₱{event.price}</span>
            <span className="card-event-type">{event.eventType}</span>
          </div>

          <div className="card-registered">You are registered</div>

          {event.isPastEvent && (
            <div className="card-past-event">Event has passed</div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RegisteredEventCard;
