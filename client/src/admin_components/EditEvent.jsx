import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Swal from "sweetalert2";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [eventData, setEventData] = useState({
    title: "",
    about: "",
    location: "",
    coordinates: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(isEditing);
  isEditingRef.current = isEditing;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        const event = res.data.event;

        const address = event.location || "Manila, Philippines";
        const coordinates = event.coordinates;

        const geoRes = await axios.post("/api/events/location/geocode", {
          address,
        });
        const { lat, lon, display_name } = geoRes.data;

        const newEventData = {
          title: event.title || "",
          about: event.about || "",
          location: display_name || "",
          coordinates:
            coordinates && coordinates.length === 2 ? coordinates : [lon, lat],
        };

        setOriginalData({
          ...event,
          coordinates: newEventData.coordinates,
          location: display_name,
        });
        setEventData(newEventData);
      } catch (err) {
        console.error("Failed to fetch event:", err.response?.data || err.message);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj",
      center: [120.9822, 14.6042],
      zoom: 16,
    });

    mapRef.current.on("click", (e) => {
      if (!isEditingRef.current) return;

      const { lng, lat } = e.lngLat;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const marker = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      markerRef.current = marker;

      setEventData((prev) => ({
        ...prev,
        coordinates: [lng, lat],
      }));

      axios
        .post("/api/events/location/reverse-geocode", { lat, lon: lng })
        .then((res) => {
          const { display_name } = res.data;
          setEventData((prev) => ({
            ...prev,
            location: display_name,
          }));
        })
        .catch((err) => {
          console.error("Geocoding failed:", err);
        });
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !eventData.coordinates) return;

    const [lng, lat] = eventData.coordinates;
    if (isNaN(lng) || isNaN(lat)) return;

    mapRef.current.setCenter([lng, lat]);

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const marker = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .setPopup(
        new maplibregl.Popup().setText(eventData.location || "Event Location")
      )
      .addTo(mapRef.current);

    markerRef.current = marker;
  }, [eventData.coordinates, eventData.location]);

  useEffect(() => {
    const updateCoordinates = async () => {
      if (!isEditing || !eventData.location) return;

      try {
        const res = await axios.post("/api/event/location/geocode", {
          address: eventData.location,
        });
        const { lat, lon } = res.data;
        setEventData((prev) => ({
          ...prev,
          coordinates: [lon, lat],
        }));
      } catch (err) {
        console.error(
          "Failed to update coordinates from location:",
          err.response?.data || err.message
        );
      }
    };

    const debounce = setTimeout(updateCoordinates, 600);
    return () => clearTimeout(debounce);
  }, [eventData.location, isEditing]);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/events/${id}`, eventData);
      setOriginalData(eventData);
      setIsEditing(false);
      Swal.fire({
        icon: "success",
        title: "Event Saved",
        text: "The event has been updated successfully!",
        timer: 1000,
        showConfirmButton: false,
      });
      navigate(`/admin/events`);
    } catch (err) {
      console.error("Failed to update event:", err.response?.data || err.message);
    }
  };

  const handleCancel = () => {
    setEventData(originalData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex flex-col items-center py-6 px-3 sm:py-10 sm:px-6">
      <div className="w-full max-w-md sm:max-w-4xl md:max-w-5xl">
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 shadow mb-4 w-full sm:w-auto"
            >
              ← Back
            </button>
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-4 sm:p-6 mb-6 shadow text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                Edit Event
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Title
              </label>
              <input
                name="title"
                value={eventData.title}
                onChange={handleChange}
                placeholder={originalData.title || "Title"}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-base sm:text-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                About
              </label>
              <textarea
                name="about"
                value={eventData.about}
                onChange={handleChange}
                placeholder={originalData.about || "About the Event"}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-300 focus:outline-none min-h-[100px]"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Location
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  name="location"
                  value={eventData.location}
                  onChange={handleChange}
                  placeholder={originalData.location || "Location"}
                  className="flex-1 border border-gray-300 px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
                <button
                  type="button"
                  className="w-full sm:w-auto bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition"
                  onClick={async () => {
                    try {
                      const res = await axios.post(
                        "/api/events/location/geocode",
                        { address: eventData.location }
                      );
                      const { lat, lon, display_name } = res.data;
                      setEventData((prev) => ({
                        ...prev,
                        location: display_name,
                        coordinates: [lon, lat],
                      }));
                    } catch (err) {
                      alert("Location not found.");
                    }
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            <div
              className="h-56 sm:h-64 w-full rounded-lg overflow-hidden border border-gray-200 mb-4"
              ref={mapContainerRef}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-green-400 text-white px-6 py-3 rounded-lg font-semibold text-base sm:text-lg hover:from-green-600 hover:to-green-500 transition shadow"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-300 text-white px-6 py-3 rounded-lg font-semibold text-base sm:text-lg hover:from-gray-500 hover:to-gray-400 transition shadow"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
