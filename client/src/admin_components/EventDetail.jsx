import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EventDetail = () => {
  const navigate = useNavigate(); 
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        setEvent(res.data.event);
      } catch (err) {
        console.error("Failed to fetch event:", err.response?.data || err.message);
      }
    };

    fetchEvent();
  }, [id]);

  if (!event) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        className="mb-4 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="text-gray-600">
        {new Date(event.date).toLocaleDateString()} at {event.time}
      </p>
      <p className="text-gray-600 mb-4">{event.location}</p>
      <p className="mb-4">{event.about}</p>
      <div className="font-bold text-lg text-primary">${event.price}</div>

      <button
        className="mt-6 bg-yellow-500 text-white px-6 py-2 rounded-full hover:bg-yellow-600 transition-all"
        onClick={() => navigate(`/events/edit/${id}`)}
      >
        Edit Event
      </button>
    </div>
  );
};

export default EventDetail;
