import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Sidebar from "../superAdmin_components/Sidebar";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const Events = () => {
  const mapContainer = useRef(null);
  const [lngLat, setLngLat] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const navigate = useNavigate();
  const { userData, getUserData, backendUrl, isAdmin } = useContext(AppContent);
  const markerRef = useRef(null);
  const mapRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

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
      // Not an admin, redirect to home or another page
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

    // ✅ Only require a map location for non-webinar events
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

        try {
          const uploadRes = await axios.post(
            `https://api.cloudinary.com/v1_1/dqbnc38or/image/upload`,
            formData,
            { withCredentials: false }
          );
          imageUrl = uploadRes.data.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          toast.error("Image upload failed. Please try again.");
          return;
        }
      }

      const timeIn24Hour = eventData.time.split(" ")[0];

      const payload = {
        ...eventData,
        time: timeIn24Hour,
        image: imageUrl,
        cost: eventData.cost,
        coordinates: eventData.eventType === "Webinar" ? null : lngLat, // ✅ no coordinates for webinars
        webinarLink:
          eventData.eventType === "Webinar" ? eventData.webinarLink : undefined,
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

        // Reset form
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

  // useEffect(() => {
  //   const checkAccess = async () => {
  //     try {
  //       if (!userData) {
  //         const fetched = await getUserData();
  //         if (fetched?.userType !== "admin") {
  //           toast.error("Access denied");
  //           navigate("/admin");
  //           return;
  //         }
  //       } else if (userData.userType !== "admin") {
  //         toast.error("Access denied");
  //         navigate("/admin");
  //         return;
  //       }
  //     } catch (error) {
  //       console.error("Error checking access:", error);
  //       toast.error("Error checking access");
  //       navigate("/admin");
  //     }
  //   };

  //   checkAccess();
  // }, [userData, navigate, getUserData]);

  useEffect(() => {
    if (
      mapContainer.current &&
      showAddForm &&
      eventData.eventType !== "Webinar"
    ) {
      // ✅ Safely remove the previous map instance before creating a new one
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

        if (markerRef.current) {
          markerRef.current.remove();
        }

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
        // ✅ Safe cleanup
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

  if (userData.userType !== "admin") {
    return null;
  }

  const handleEdit = (eventId) => {
    navigate(`/superadmin/events/edit/${eventId}`); // Add rescheduling logic here
    // Add edit logic here (e.g., open a modal or form)
  };

  const handleReschedule = (eventId) => {
    navigate(`/superadmin/events/reschedule/${eventId}`); // Add rescheduling logic here
  };

  const handleCancel = async (eventId) => {
    try {
      const confirm = window.confirm(
        "Are you sure you want to cancel this event?"
      );
      if (!confirm) return;

      const { data } = await axios.put(
        `${backendUrl}/api/superadmin/cancel-event/${eventId}`
      );
      if (data.success) {
        toast.success("Event cancelled successfully");
        const res = await axios.get("/api/events");
        setEvents(res.data.events);
      } else {
        toast.error(data.message || "Failed to cancel");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error cancelling event");
    }
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Events Management</h1>
          {userData ? (
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {userData.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-lg font-semibold text-gray-800">
                  {userData.fullName}
                </p>
              </div>
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

        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAddForm ? "Cancel" : "Add New Event"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md p-8 rounded-xl max-w-2xl mx-auto grid gap-6 mb-8"
          >
            {[
              { name: "title", label: "Title" },
              {
                name: "date",
                label: "Date",
                type: "date",
                min: new Date().toISOString().split("T")[0],
              },
              { name: "price", label: "Event Price (ticket/registration fee)" },
              {
                name: "cost",
                label: "Event Cost (expenses, e.g. rent, materials)",
                type: "number",
                helper:
                  "How much you spent for this event (e.g. venue, food, materials, etc.)",
              },
              { name: "about", label: "About the Event" },
              { name: "hostName", label: "Host Name" },
            ].map(({ name, label, type = "text", helper }) => (
              <div key={name} className="flex flex-col">
                <label className="mb-1 font-semibold">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={eventData[name]}
                  onChange={handleChange}
                  min={
                    name === "date"
                      ? new Date().toISOString().split("T")[0]
                      : undefined
                  }
                  className="border border-gray-300 rounded-md px-4 py-2"
                  required={["title", "date", "cost"].includes(name)}
                />
                {helper && (
                  <span className="text-xs text-gray-500 mt-1">{helper}</span>
                )}
              </div>
            ))}

            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Time</label>
              <input
                type="time"
                name="time"
                value={eventData.time}
                onChange={handleChange}
                min={
                  eventData.date === new Date().toISOString().split("T")[0]
                    ? new Date().toTimeString().slice(0, 5)
                    : undefined
                }
                className="border border-gray-300 rounded-md px-4 py-2"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Event Type</label>
              <select
                name="eventType"
                value={eventData.eventType}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2"
                required
              >
                <option value="">Select type</option>
                <option value="Seminar">Seminar</option>
                <option value="Webinar">Webinar</option>
                <option value="Activity">Activity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {eventData.eventType === "Webinar" && (
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Webinar Link</label>
                <input
                  type="url"
                  name="webinarLink"
                  value={eventData.webinarLink || ""}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2"
                  placeholder="https://zoom.us/..."
                  required
                />
              </div>
            )}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Participant</label>
              <select
                name="eventTarget"
                value={eventData.eventTarget}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2"
                required
              >
                <option value="">Select participant</option>
                <option value="Student">Student</option>
                <option value="Professional">Professional</option>
                <option value="Both">Both</option>
              </select>
            </div>
            {eventData.eventType !== "Webinar" && (
              <>
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold">Search Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="location"
                      value={eventData.location}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-md px-4 py-2"
                      placeholder="Ex: SM Megamall, etc"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!eventData.location) return;
                        try {
                          const res = await fetch(
                            `https://api.maptiler.com/geocoding/${encodeURIComponent(
                              eventData.location
                            )}.json?key=cyT8CBxXMzVIORtIP1Pj`
                          );
                          const data = await res.json();
                          const feature = data.features[0];
                          if (feature) {
                            const [lng, lat] = feature.center;
                            setLngLat([lng, lat]);
                            setPlaceName(feature.place_name);
                            setEventData((prev) => ({
                              ...prev,
                              location: feature.place_name,
                            }));
                            if (markerRef.current) markerRef.current.remove();

                            const newMarker = new maplibregl.Marker()
                              .setLngLat([lng, lat])
                              .addTo(mapRef.current);

                            markerRef.current = newMarker;
                            mapRef.current.flyTo({
                              center: [lng, lat],
                              zoom: 15,
                            });
                          } else {
                            toast.error("No location found.");
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error("Search failed.");
                        }
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-semibold">
                    Pick Location (Map)
                  </label>
                  <div
                    ref={mapContainer}
                    className="h-64 rounded border border-gray-300 mb-2"
                  />
                  <p className="text-sm text-gray-500">
                    {placeName
                      ? `Selected: ${placeName}`
                      : "Click on the map to select a location"}
                  </p>
                  {lngLat && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Coordinates selected: {lngLat[1]?.toFixed(6)},{" "}
                      {lngLat[0]?.toFixed(6)}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Event Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition"
            >
              Create Event
            </button>
          </form>
        )}

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-200 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Event Type</th>
                <th className="px-6 py-3">Participants</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map((event, idx) => {
                  const isPastEvent = new Date(event.date) < new Date();

                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-6 py-4">{event.title}</td>
                      <td className="px-6 py-4">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{event.time}</td>
                      <td className="px-6 py-4">₱{event.price}</td>
                      <td className="px-6 py-4">{event.eventType}</td>
                      <td className="px-10 py-4">
                        {event.registrations ? event.registrations.length : 0}
                      </td>
                      <td className="px-6 py-4">
                        {event.status === "cancelled" ? (
                          <button
                            className="text-green-600 font-semibold hover:underline"
                            onClick={() => handleReactivate(event._id)}
                          >
                            Reactivate
                          </button>
                        ) : isPastEvent ? (
                          <Link
                            to={`/adminevents/${event._id}`}
                            className="text-blue-600 hover:underline text-sm"
                          ></Link>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              className="text-yellow-600"
                              onClick={() => handleEdit(event._id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              className="text-indigo-600"
                              onClick={() => handleReschedule(event._id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 7V3m8 4V3m-9 8h8m-8 4h8m-8 4h8m2-4V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-3a2 2 0 000 0z"
                                />
                              </svg>
                            </button>
                            <button
                              className="text-red-600"
                              onClick={() => handleCancel(event._id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-9H4a1 1 0 01-1-1V5a1 1 0 011-1h9V3a1 1 0 011-1h2a1 1 0 011 1v1h2a1 1 0 011 1v1a1 1 0 01-1 1z"
                                />
                              </svg>
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
                    className="text-center px-6 py-4 text-gray-500"
                  >
                    No events found or failed to load.
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

export default Events;
