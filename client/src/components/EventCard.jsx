import React from "react";
import { Link } from "react-router-dom";

const EventCard = ({ event }) => {
  const placeholderImage = "/placeholder.jpg";

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link to={`/events/${event._id}`} className="block h-full">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden hover:-translate-y-1">
        {/* Image */}
        <div className="relative">
          <img
            src={event.image || placeholderImage}
            alt={event.title}
            className="w-full h-40 sm:h-52 lg:h-60 object-cover bg-gray-100 transition-transform duration-300 hover:scale-105"
          />

          {/* Price Badge */}
          <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white text-blue-600 font-bold text-xs sm:text-sm lg:text-base px-2 sm:px-3 py-0.5 sm:py-1 rounded-md shadow-md border border-gray-200">
            ₱{event.price?.toLocaleString() || "Free"}
          </span>

          {/* Event Type Badge */}
          {event.eventType && (
            <span
              className={`absolute top-2 sm:top-3 right-2 sm:right-3 text-white font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[0.65rem] sm:text-xs uppercase tracking-wide shadow-md
                ${
                  event.eventType.toLowerCase() === "webinar"
                    ? "bg-blue-900"
                    : event.eventType.toLowerCase() === "seminar"
                    ? "bg-blue-400"
                    : "bg-blue-600"
                }`}
            >
              {event.eventType}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 flex-1">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 leading-snug line-clamp-2">
            {event.title}
          </h3>

          {/* Date */}
          <p className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 9h18" />
            </svg>
            {formattedDate}
          </p>

          {/* Time */}
          <p className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {formattedTime}
          </p>

          {/* Location (only if not webinar) */}
          {event.eventType !== "Webinar" && event.location && (
            <p className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
              {event.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
