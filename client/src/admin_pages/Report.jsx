import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../admin_components/Sidebar";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";

const Report = () => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContent);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events");
        const eventsData = res.data.events;

        // Dummy logic: ensure attendees and registered fields exist for the demo
        const enrichedEvents = eventsData.map((event) => ({
          ...event,
          totalRegistered: event.registered?.length || 0,
          totalAttended: event.attendees?.length || 0,
          cost: event.price || 0,
        }));

        setEvents(enrichedEvents);
        setFilteredEvents(enrichedEvents);

        const uniqueTypes = ["All", ...new Set(eventsData.map(e => e.eventType))];
        setEventTypes(uniqueTypes);
      } catch (err) {
        console.error("Error fetching events:", err.response?.data || err.message);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedType === "All") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.eventType === selectedType));
    }
  }, [selectedType, events]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Event Attendance Report</h1>
          {userData ? (
            <div className="w-10 h-10 flex justify-center items-center rounded-full bg-black text-white text-lg">
              {userData.fullName[0].toUpperCase()}
            </div>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
            >
              Login <img src={assets.arrow_icon} alt="Arrow Icon" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="mb-4">
          <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Event Type:
          </label>
          <select
            id="eventType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            {eventTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-200 text-xs uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Registered</th>
                <th className="px-6 py-3">Attended</th>
                <th className="px-6 py-3">Not Attended</th>
                <th className="px-6 py-3">Cost (₱)</th>
                <th className="px-6 py-3">Revenue</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, idx) => {
                  const { totalRegistered, totalAttended, cost } = event;
                  const notAttended = totalRegistered - totalAttended;
                  const revenue = totalAttended * cost;

                  return (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{event.title}</td>
                      <td className="px-6 py-4">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{totalRegistered}</td>
                      <td className="px-6 py-4">{totalAttended}</td>
                      <td className="px-6 py-4">{notAttended}</td>
                      <td className="px-6 py-4">₱{cost}</td>
                      <td className="px-6 py-4 font-medium text-green-600">₱{revenue}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/events/${event._id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center px-6 py-4 text-gray-500">
                    No events found for selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Report;