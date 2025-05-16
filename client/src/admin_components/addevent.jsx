import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Sidebar from "../admin_components/Sidebar";
import  {assets}  from "../assets/assets"; 

const AddEvent = () => {
  const mapContainer = useRef(null);
  const [lngLat, setLngLat] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const navigate = useNavigate();
  const { userData, getUserData, backendUrl } = useContext(AppContent);
  const markerRef = useRef(null);
  const mapRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);

  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    price: "",
    about: "",
    hostName: "",
    eventType: "",
    eventTarget: "",
  });
  useEffect(() => {
    if (mapContainer.current) {
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
  
        const newMarker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
        markerRef.current = newMarker;
  
        try {
          const res = await axios.post(`${backendUrl}/api/location/reverse-geocode`, {
            lat,
            lon: lng,
          });
          const { display_name } = res.data;
          setPlaceName(display_name);

          setEventData((prevData) => ({
            ...prevData,
            location: display_name,
          }));
          
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        }
      });
  
      return () => map.remove();
    }
  }, []);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      let imageUrl = "";
  
      // Upload image to Cloudinary
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "event_preset"); 
  
        try {
          const uploadRes = await axios.post(
            `https://api.cloudinary.com/v1_1/dqbnc38or/image/upload`,
            formData,
            {
              withCredentials: false, 
            }
            
          );
          console.log("Cloudinary upload success:", uploadRes.data);
          imageUrl = uploadRes.data.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          toast.error("Image upload failed. Please check your network or try a smaller image.");
          return;
        }
      }
  
      const timeIn24Hour = eventData.time.split(" ")[0];
  
      const payload = {
        ...eventData,
        location: placeName || eventData.location,
        coordinates: lngLat,
        time: timeIn24Hour,
        image: imageUrl,
      };
  
      const { data } = await axios.post(
        `${backendUrl}/api/events/create`,
        payload
      );
  
      if (data.success) {
        toast.success("Event created successfully!");
        navigate("/admin/dashboard");
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      console.log("Checking access for userData:", userData);
      if (!userData) {
        const fetched = await getUserData();
        if (fetched?.userType !== "admin") {
          toast.error("Access denied");
          navigate("/");
        }
        console.log("Fetched userData:", fetched);
        console.log("User type:", fetched?.userType);
      } else if (userData.userType !== "admin") {
        toast.error("Access denied");
        navigate("/");
      }
    };

    checkAccess();
  }, [userData]);

  if (!userData || userData.userType !== "admin") {
    return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Add Event</h1>
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

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md p-8 rounded-xl max-w-2xl mx-auto grid gap-6"
        >
          {/* All text inputs */}
          {[
            { name: "title", label: "Title" },
            { name: "date", label: "Date", type: "date" },
            { name: "price", label: "Price" },
            { name: "about", label: "About the Event" },
            { name: "hostName", label: "Host Name" },
          ].map(({ name, label, type = "text" }) => (
            <div key={name} className="flex flex-col">
              <label className="mb-1 font-semibold">{label}</label>
              <input
                type={type}
                name={name}
                value={eventData[name]}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2"
                required={["title", "date"].includes(name)}
              />
            </div>
          ))}

          {/* Time */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Time</label>
            <input
              type="time"
              name="time"
              value={eventData.time}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2"
              required
            />
          </div>

          {/* Location Search */}
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
                      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
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

          {/* Event Type */}
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

          {/* Event Target */}
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

          {/* Map */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Pick Location (Map)</label>
            <div ref={mapContainer} className="h-64 rounded border border-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {placeName ? `Selected: ${placeName}` : "Click on the map to select a location"}
            </p>
          </div>
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
          {/* Submit Button */}
          <button
            type="submit"
            className="bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition"
          >
            Create Event
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddEvent;
