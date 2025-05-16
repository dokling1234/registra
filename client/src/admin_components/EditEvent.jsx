import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
    registrations: [],
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

        const geoRes = await axios.post("/api/location/geocode", { address });
        const { lat, lon, display_name } = geoRes.data;

        setEventData({
          title: event.title,
          about: event.about,
          location: display_name,
          coordinates: coordinates && coordinates.length === 2 ? coordinates : [lon, lat],
          registrations: event.registrations || [],
        });
        setOriginalData({
          ...event,
          coordinates: coordinates && coordinates.length === 2 ? coordinates : [lon, lat],
          location: display_name,
          registrations: event.registrations || [],
        });
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
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=cyT8CBxXMzVIORtIP1Pj',
      center: [120.9822, 14.6042],
      zoom: 16,
    });

    mapRef.current.on('click', (e) => {
      if (!isEditingRef.current) return;

      const { lng, lat } = e.lngLat;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const marker = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      markerRef.current = marker;

      setEventData(prev => ({
        ...prev,
        coordinates: [lng, lat],
      }));

      axios.post("/api/location/reverse-geocode", { lat, lon: lng })
        .then(res => {
          const { display_name } = res.data;
          setEventData(prev => ({
            ...prev,
            location: display_name,
          }));
        })
        .catch(err => {
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
      .setPopup(new maplibregl.Popup().setText(eventData.location || "Event Location"))
      .addTo(mapRef.current);

    markerRef.current = marker;
  }, [eventData.coordinates, eventData.location]);

  useEffect(() => {
    const updateCoordinates = async () => {
      if (!isEditing || !eventData.location) return;

      try {
        const res = await axios.post("/api/location/geocode", { address: eventData.location });
        const { lat, lon } = res.data;
        setEventData(prev => ({
          ...prev,
          coordinates: [lon, lat],
        }));
      } catch (err) {
        console.error("Failed to update coordinates from location:", err.response?.data || err.message);
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
      navigate(`/events/${id}`);
    } catch (err) {
      console.error("Failed to update event:", err.response?.data || err.message);
    }
  };

  const handleCancel = () => {
    setEventData(originalData);
    setIsEditing(false);
  };

  const handlePaymentStatus = async (registrantId, status) => {
    try {
      await axios.put(`/api/events/updatePaymentStatus/${id}`, {
        registrantId,
        paymentStatus: status,
      });
      setEventData(prev => ({
        ...prev,
        registrations: prev.registrations.map(reg => 
          reg._id === registrantId ? { ...reg, paymentStatus: status } : reg
        ),
      }));
      alert("Payment status updated!");
    } catch (err) {
      console.error("Failed to update payment status:", err.response?.data || err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
       className="mb-4 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
      >
        ← Back
      </button>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={eventData.title}
            onChange={handleChange}
            placeholder="Title"
            className="w-full border px-4 py-2 rounded"
            disabled={!isEditing}
          />

          <textarea
            name="about"
            value={eventData.about}
            onChange={handleChange}
            placeholder="About"
            className="w-full border px-4 py-2 rounded"
            disabled={!isEditing}
          />

          <input
            name="location"
            value={eventData.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full border px-4 py-2 rounded"
            disabled={!isEditing}
          />

          <div className="h-64 w-full rounded overflow-hidden border" ref={mapContainerRef} />

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700"
            >
              Edit
            </button>
          ) : (
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-bold text-xl mb-4">Registrations</h3>
            {eventData.registrations.length > 0 ? (
              <ul>
                {eventData.registrations.map((registrant) => (
                  <li key={registrant._id} className="mb-2">
                    {registrant.name} (Status: {registrant.paymentStatus})
                    {registrant.paymentStatus === "pending" && (
                      <button
                        onClick={() => handlePaymentStatus(registrant._id, "paid")}
                        className="ml-4 text-green-500 hover:text-green-700"
                      >
                        Confirm Payment
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No registrations yet.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
