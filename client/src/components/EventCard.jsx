import React from "react";
import { Link } from "react-router-dom";
import "./EventCard.css"; // Assuming you have a CSS file for EventCard

const EventCard = ({ event }) => {
  const placeholderImage = "/placeholder.jpg"; // Path to your placeholder image

  return (
<Link to={`/events/${event._id}`}>
    <div className="event-card">
      <img
        src={event.image || placeholderImage}
        alt={event.title}
        className="event-card-image"
      />
      <div className="event-card-content">
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-date">{new Date(event.date).toLocaleDateString()}</p>
        <p className="event-card-location">{event.location}</p>
      </div>
    </div>
    </Link>
  );
};

export default EventCard;
