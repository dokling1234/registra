import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const Reschedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const today = new Date();
  const minDate = today.toISOString().slice(0, 10);

  const [eventData, setEventData] = useState({
    newDate: "",
    newTime: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        const event = res.data.event;

        const isoDate = new Date(event.date);
        const dateStr = isoDate.toISOString().slice(0, 10);
        const timeStr = isoDate.toTimeString().slice(0, 5);

        setEventData({
          newDate: dateStr,
          newTime: timeStr,
        });
        setOriginalData({
          title: event.title,
          date: dateStr,
          time: timeStr,
        });
      } catch (err) {
        console.error(
          "Failed to fetch event:",
          err.response?.data || err.message
        );
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleReschedule = async () => {
    setIsLoading(true);
    try {
      const newDateTime = new Date(`${eventData.newDate}T${eventData.newTime}`);
      const now = new Date();

      // Prevent rescheduling to a past date/time
      if (newDateTime < now) {
        Swal.fire({
          icon: "error",
          title: "Invalid Date",
          text: "You cannot reschedule to a past date and time.",
          confirmButtonText: "OK",
        });
        setIsLoading(false);
        return;
      }

      await axios.put(`/api/events/${id}`, { date: newDateTime });
      Swal.fire({
        icon: "success",
        title: "Event Saved",
        text: "The event has been updated successfully!",
        timer: 1000,
        showConfirmButton: false,
      });
      navigate(`/admin/events`);
    } catch (err) {
      console.error(
        "Failed to update event:",
        err.response?.data || err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEventData({
      newDate: originalData.date,
      newTime: originalData.time,
    });
    navigate(`/superadmin/events`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Reschedule Event
          </h2>
          {originalData.title && (
            <p className="text-gray-600">Event: {originalData.title}</p>
          )}
        </div>

        {/* Original Date & Time Display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 font-medium">Current Schedule:</p>
          <p className="text-blue-800 font-semibold">
            {originalData.date} at {originalData.time}
          </p>
        </div>

        {/* Date & Time Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              New Date
            </label>
            <input
              type="date"
              name="newDate"
              value={eventData.newDate}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-300 focus:outline-none"
              required
              min={minDate}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              New Time
            </label>
            <input
              type="time"
              name="newTime"
              value={eventData.newTime}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-300 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleReschedule}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition shadow ${
              isLoading
                ? "bg-green-300 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500"
            }`}
          >
            {isLoading ? "Processing..." : "Confirm Reschedule"}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-300 hover:from-gray-500 hover:to-gray-400 transition shadow"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reschedule;
