import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import EventList from "./EventList";
import Footer from "../components/Footer";
import "./Home.css"; //css home

const Home = () => {
  const { isAdmin } = useContext(AppContent);
  const navigate = useNavigate();

  console.log(isAdmin);
  useEffect(() => {
    if (isAdmin) {
      // Not an admin, redirect to home or another page
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const [filters, setFilters] = useState({
    eventType: "",
    location: "",
    startDate: "",
    endDate: "",
  });

  const resetFilters = () => {
    setFilters({
      eventType: "",
      location: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="home-container">
      <Navbar resetFilters={resetFilters} />
      <Header filters={filters} setFilters={setFilters} />
      <EventList filters={filters} />
      <Footer />
    </div>
  );
};

export default Home;
