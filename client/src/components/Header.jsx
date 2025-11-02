import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";

const carouselItems = [
  { id: 1, image: assets.slide1 },
  { id: 2, image: assets.slide2 },
  { id: 3, image: assets.slide3 },
];

const Header = ({ filters, setFilters, onSearch }) => {
  const [current, setCurrent] = useState(0);
  const [localFilters, setLocalFilters] = useState(filters || {});
  const { userData } = useContext(AppContent);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((p) => (p + 1) % carouselItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const prev = () =>
    setCurrent((i) => (i - 1 + carouselItems.length) % carouselItems.length);
  const next = () => setCurrent((i) => (i + 1) % carouselItems.length);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setFilters(localFilters);
    if (onSearch) onSearch(localFilters);
  };

  return (
    <div
      className="relative w-full text-center text-gray-800"
      /* Small responsive top padding so carousel sits a bit below the navbar */
      style={{ paddingTop: "1.5rem" }} // you can tweak this value as needed
    >
      {/* ✅ HERO CAROUSEL */}
      <div className="relative w-full overflow-hidden">
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            minHeight: "85vh", // taller hero
            maxHeight: "85vh",
          }}
        >
          {carouselItems.map((item, index) => (
            <motion.img
              key={item.id}
              src={item.image}
              alt={`Slide ${item.id}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-800 ease-in-out ${
                index === current
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              style={{ objectPosition: "center center" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === current ? 1 : 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          ))}

          {/* soft overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

          {/* arrows */}
          <button
            onClick={prev}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center shadow-md transition"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center shadow-md transition"
          >
            ›
          </button>

          {/* ✅ CENTERED TITLE */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white text-center px-4"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1
              className="font-extrabold leading-tight drop-shadow-2xl"
              style={{
                fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                lineHeight: 1.15,
                color: "rgba(255,255,255,0.95)", // slightly brighter white
              }}
            >
              INSTITUTE OF COMPUTER ENGINEERS OF THE PHILIPPINES
            </h1>

            <p
              className="mt-3 max-w-2xl text-gray-200 text-sm sm:text-base md:text-lg opacity-90"
              style={{
                textShadow: "0 2px 10px rgba(0,0,0,0.7)", // deeper shadow for readability
              }}
            >
              ICpEP (Institute of Computer Engineers of the Philippines) is
              registered under the Securities and Exchange Commission (SEC Reg.
              No. 201120675) as a non-stock, non-profit professional
              organization of computer engineers in the Philippines.
            </p>
          </motion.div>

          {/* dots */}
          <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2 md:gap-3">
            {carouselItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`rounded-full transition-all ${
                  idx === current
                    ? "w-3.5 h-3.5 bg-white scale-110"
                    : "w-2.5 h-2.5 bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ✅ SEARCH CARD (slightly raised and centered) */}
      <div
        className="w-full max-w-4xl mx-auto backdrop-blur-md bg-[#0b1320]/60 text-gray-100 rounded-lg shadow-2xl mt-[-3rem] sm:mt-[-3.5rem] md:mt-[-4rem] p-3 sm:p-5 md:p-6 relative z-40"
        style={{ boxShadow: "0 8px 24px rgba(2,6,23,0.55)" }}
      >
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch gap-3 sm:gap-5 text-sm">
          <div className="flex flex-col text-left w-full sm:w-auto">
            <label
              htmlFor="eventType"
              className="font-semibold mb-1 text-white text-xs sm:text-sm"
            >
              Event Type
            </label>
            <select
              id="eventType"
              name="eventType"
              value={localFilters.eventType || ""}
              onChange={handleChange}
              className="bg-slate-700 text-gray-100 rounded-md px-2 py-2 w-full sm:w-40 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All</option>
              <option value="seminar">Seminar</option>
              <option value="webinar">Webinar</option>
              <option value="activity">Activity</option>
            </select>
          </div>

          <div className="flex flex-col text-left w-full sm:w-auto">
            <label
              htmlFor="location"
              className="font-semibold mb-1 text-white text-xs sm:text-sm"
            >
              Location
            </label>
            <select
              id="location"
              name="location"
              value={localFilters.location || ""}
              onChange={handleChange}
              className="bg-slate-700 text-gray-100 rounded-md px-2 py-2 w-full sm:w-40 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All</option>
              {[
                "Manila",
                "Quezon City",
                "Makati",
                "Pasig",
                "Taguig",
                "Mandaluyong",
                "Caloocan",
                "Valenzuela",
                "Malabon",
                "Navotas",
                "Marikina",
                "Parañaque",
                "Las Piñas",
                "Muntinlupa",
                "San Juan",
                "Pateros",
              ].map((city) => (
                <option key={city.toLowerCase()} value={city.toLowerCase()}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col text-left w-full sm:w-auto">
            <label
              htmlFor="startDate"
              className="font-semibold mb-1 text-white text-xs sm:text-sm"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={localFilters.startDate || ""}
              onChange={handleChange}
              className="bg-slate-700 text-gray-100 rounded-md px-2 py-2 w-full sm:w-40 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col text-left w-full sm:w-auto">
            <label
              htmlFor="endDate"
              className="font-semibold mb-1 text-white text-xs sm:text-sm"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={localFilters.endDate || ""}
              onChange={handleChange}
              className="bg-slate-700 text-gray-100 rounded-md px-2 py-2 w-full sm:w-40 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col text-left w-full sm:w-auto justify-end">
            <button
              onClick={handleSearch}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] transition text-white font-semibold px-4 py-2 rounded-md text-sm w-full sm:w-auto"
              style={{ boxShadow: "0 6px 14px rgba(37,99,235,0.25)" }}
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
