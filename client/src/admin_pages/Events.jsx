import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Sidebar from "../admin_components/Sidebar";
import { Menu } from "lucide-react";
import Swal from "sweetalert2";

const Events = () => {
  const mapContainer = useRef(null);
  const [lngLat, setLngLat] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const navigate = useNavigate();
  const { userData, backendUrl, isAdmin } = useContext(AppContent);
  const markerRef = useRef(null);
  const mapRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    price: "",
    cost: "",
    about: "",
    hostName: "",
    eventType: "",
    eventTarget: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events");
        setEvents(res.data.events);
      } catch (err) {
        console.error(
          "Error fetching events:",
          err.response?.data || err.message
        );
      }
    };
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (eventData.eventType !== "Webinar" && !lngLat) {
      toast.error(
        "Please select a location on the map before creating the event."
      );
      return;
    }

    try {
      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "event_preset");

        const uploadRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dqbnc38or/image/upload",
          formData,
          {
            headers: { "X-Requested-With": "XMLHttpRequest" },
            withCredentials: false, // 🚀 very important
          }
        );

        imageUrl = uploadRes.data.secure_url;
      }
      const payload = {
        ...eventData,
        image: imageUrl,
        coordinates: eventData.eventType === "Webinar" ? null : lngLat,
      };

      const { data } = await axios.post(
        `${backendUrl}/api/events/create`,
        payload
      );

      if (data.success) {
        toast.success("Event created successfully!");
        setShowAddForm(false);
        const res = await axios.get("/api/events");
        setEvents(res.data.events);
        setEventData({
          title: "",
          date: "",
          time: "",
          price: "",
          cost: "",
          about: "",
          hostName: "",
          eventType: "",
          eventTarget: "",
        });
        setImageFile(null);
        setLngLat(null);
        setPlaceName("");
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (
      mapContainer.current &&
      showAddForm &&
      eventData.eventType !== "Webinar"
    ) {
      if (mapRef.current && mapRef.current.remove) {
        try {
          mapRef.current.remove();
        } catch (err) {
          console.warn("Map removal skipped:", err);
        }
      }

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style:
          "https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj",
        center: [121.0437, 14.676],
        zoom: 12,
      });

      mapRef.current = map;

      map.on("click", async (e) => {
        const { lng, lat } = e.lngLat;
        setLngLat([lng, lat]);

        if (markerRef.current) markerRef.current.remove();

        const newMarker = new maplibregl.Marker()
          .setLngLat([lng, lat])
          .addTo(map);
        markerRef.current = newMarker;

        try {
          const res = await axios.post(
            `${backendUrl}/api/events/location/reverse-geocode`,
            { lat, lon: lng }
          );
          setPlaceName(res.data.display_name);
          setEventData((prev) => ({
            ...prev,
            location: res.data.display_name,
          }));
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        }
      });

      return () => {
        if (mapRef.current && mapRef.current.remove) {
          try {
            mapRef.current.remove();
          } catch (err) {
            console.warn("Cleanup skipped:", err);
          }
        }
      };
    }
  }, [showAddForm, eventData.eventType]);

  if (!userData) {
    return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  }

  const handleEdit = (eventId) => navigate(`/events/edit/${eventId}`);
  const handleReschedule = (eventId) =>
    navigate(`/superadmin/events/reschedule/${eventId}`);

  const handleCancel = async (eventId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will cancel the event and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No, keep it",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { data } = await axios.put(
            `${backendUrl}/api/superadmin/cancel-event/${eventId}`
          );

          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Event Cancelled",
              text: "The event has been cancelled successfully.",
              timer: 1500,
              showConfirmButton: false,
            });

            const res = await axios.get("/api/events");
            setEvents(res.data.events);
          }
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.response?.data?.message || "Error cancelling event",
          });
        }
      }
    });
  };

  const handleReactivate = async (eventId) => {
    try {
      const confirm = window.confirm(
        "Are you sure you want to reactivate this event?"
      );
      if (!confirm) return;

      const { data } = await axios.put(
        `${backendUrl}/api/superadmin/uncancel-event/${eventId}`,
        {},
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Event reactivated successfully");
        const res = await axios.get(`${backendUrl}/api/events`);
        setEvents(res.data.events);
      } else {
        toast.error(data.message || "Failed to reactivate event");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error reactivating event");
    }
  };
  const isPast = (date) => new Date(date) < new Date();
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex flex-col flex-1 xl:ml-64 transition-all duration-300">
        {/* Mobile + iPad top bar */}
        <div className="bg-gray-900 text-white flex items-center justify-between p-4 shadow-md lg:hidden sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-lg md:text-xl font-semibold">Events</h1>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 hidden xl:block">
              Events
            </h1>

            {userData && (
              <div className="flex items-center gap-3 bg-white px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-base md:text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs md:text-sm text-gray-500">
                    Welcome back,
                  </p>
                  <p className="text-sm md:text-lg font-semibold text-gray-800">
                    {userData.fullName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Add Event Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              {showAddForm ? "Cancel" : "Add New Event"}
            </button>
          </div>

          {/* Add Event Form */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-md p-4 sm:p-6 md:p-8 rounded-xl w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8"
            >
              {[
                { name: "title", label: "Title" },
                { name: "date", label: "Date", type: "date" },
                { name: "price", label: "Price" },
                { name: "cost", label: "Event Cost (₱)", type: "number" },
                { name: "about", label: "About" },
                { name: "hostName", label: "Host Name" },
              ].map(({ name, label, type = "text" }) => (
                <div key={name} className="flex flex-col">
                  <label className="mb-1 font-semibold text-sm md:text-base">
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={eventData[name]}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base"
                    required={["title", "date"].includes(name)}
                  />
                </div>
              ))}

              {/* Time */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold text-sm md:text-base">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={eventData.time}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base"
                  required
                />
              </div>

              {/* Event Type */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold text-sm md:text-base">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={eventData.eventType}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Activity">Activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Webinar Link */}
              {eventData.eventType === "Webinar" && (
                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 font-semibold text-sm md:text-base">
                    Webinar Link
                  </label>
                  <input
                    type="url"
                    name="webinarLink"
                    value={eventData.webinarLink || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base"
                    placeholder="https://zoom.us/..."
                    required
                  />
                </div>
              )}

              {/* Location (non-webinar) */}
              {eventData.eventType !== "Webinar" && (
                <div className="md:col-span-2">
                  <label className="mb-1 font-semibold text-sm md:text-base">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={eventData.location}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm md:text-base mb-2"
                    placeholder="Enter location"
                  />
                  <div
                    ref={mapContainer}
                    className="h-64 sm:h-72 md:h-80 rounded-xl border border-gray-300 mb-2"
                  />
                  <p className="text-sm text-gray-500">
                    {placeName
                      ? `Selected: ${placeName}`
                      : "Click on the map to select a location"}
                  </p>
                </div>
              )}

              {/* Image Upload */}
              <div className="flex flex-col md:col-span-2">
                <label className="mb-1 font-semibold text-sm md:text-base">
                  Event Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base"
                  required
                />
              </div>

              <button
                type="submit"
                className="md:col-span-2 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition text-sm md:text-base"
              >
                Create Event
              </button>
            </form>
          )}

          {/* Event Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Desktop / Tablet Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm md:text-base text-left text-gray-700">
                <thead className="bg-gray-200 text-xs md:text-sm uppercase">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Participants</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length > 0 ? (
                    events.map((event, idx) => {
                      const past = isPast(event.date);

                      return (
                        <tr
                          key={idx}
                          className="border-t hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 font-medium">
                            {event.title}
                          </td>
                          <td className="px-4 py-3">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">{event.time}</td>
                          <td className="px-4 py-3">₱{event.price}</td>
                          <td className="px-4 py-3">{event.eventType}</td>
                          <td className="px-4 py-3 text-center">
                            {event.registrations?.length || 0}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {/* No actions for past events */}
                            {past ? (
                              <span className="text-gray-400 italic">
                                Past Event
                              </span>
                            ) : event.status === "cancelled" ? (
                              <button
                                onClick={() => handleReactivate(event._id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Reactivate
                              </button>
                            ) : (
                              <div className="flex gap-3 justify-center">
                                <button
                                  onClick={() => handleEdit(event._id)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                  title="Edit Event"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleReschedule(event._id)}
                                  className="text-indigo-600 hover:text-indigo-700"
                                  title="Reschedule Event"
                                >
                                  📅
                                </button>
                                <button
                                  onClick={() => handleCancel(event._id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Cancel Event"
                                >
                                  ❌
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-4 text-gray-500"
                      >
                        No events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="block sm:hidden p-4 space-y-4">
              {events.length > 0 ? (
                events.map((event, idx) => {
                  const isPastEvent = new Date(event.date) < new Date();
                  const past = isPast(event.date);
                  return (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.time}
                        </p>
                        <p className="text-xs text-gray-500">
                          Type: {event.eventType} • ₱{event.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          Participants: {event.registrations?.length || 0}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t pt-2 mt-1">
                        {/* No actions for past events */}
                        {past ? (
                          <span className="text-gray-400 italic text-sm">
                            Past Event
                          </span>
                        ) : event.status === "cancelled" ? (
                          <button
                            onClick={() => handleReactivate(event._id)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <div className="flex justify-between w-full">
                            <button
                              onClick={() => handleEdit(event._id)}
                              className="text-yellow-600 hover:text-yellow-700"
                              title="Edit Event"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleReschedule(event._id)}
                              className="text-indigo-600 hover:text-indigo-700"
                              title="Reschedule Event"
                            >
                              📅
                            </button>
                            <button
                              onClick={() => handleCancel(event._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Cancel Event"
                            >
                              ❌
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500">No events found.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Events;
