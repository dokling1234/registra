import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import "./Header.css";

const carouselItems = [
  { id: 1, image: assets.slide1 },
  { id: 2, image: assets.slide2 },
  { id: 3, image: assets.slide3 },
];

const Header = ({ filters, setFilters, onSearch }) => {
  const [current, setCurrent] = useState(0);
  const [localFilters, setLocalFilters] = useState(filters); // Local state for filters
  const { userData } = useContext(AppContent);

  // Update local filters without triggering search
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Trigger search only when the Search button is clicked
  const handleSearch = () => {
    setFilters(localFilters); // Update the global filters
    if (onSearch) {
      onSearch(localFilters); // Trigger the search action with the current filters
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="header-container">
      <div className="carousel-container">
        <img src={carouselItems[current].image} className="carousel-image" />
        <h1 className="carousel-title"> INSTITUTE OF COMPUTER ENGINEERS OF THE PHILIPPINES</h1>

        <div className="carousel-dots">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`carousel-dot ${index === current ? "active" : ""}`}
            ></button>
          ))}
        </div>
        <div className="carousel-text">{carouselItems[current].text}</div>
      </div>
      <div className="search-filter">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="eventType">Event Type</label>
            <select
              id="eventType"
              name="eventType"
              onChange={handleChange}
              value={localFilters.eventType}
            >
              <option value="">All</option>
              <option value="seminar">Seminar</option>
              <option value="webinar">Webinar</option>
              <option value="competition">Workshop</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              onChange={handleChange}
              value={localFilters.location}
            >
              <option value="">All</option>
              <option value="manila">Manila</option>
              <option value="cebu">Quezon </option>
              <option value="davao">Makati</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              onChange={handleChange}
              value={localFilters.startDate}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              onChange={handleChange}
              value={localFilters.endDate}
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>
            🔍 Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
