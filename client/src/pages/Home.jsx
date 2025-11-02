import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import EventList from "./EventList";
import Footer from "../components/Footer";

const Home = () => {
  const { isAdmin } = useContext(AppContent);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) navigate("/");
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
    <div className="bg-[#e3f4f4] min-h-screen text-gray-800">
      {/* Navbar stays sticky on top */}
      <Navbar resetFilters={resetFilters} />

      <main className="flex flex-col items-center">
        {/* ✅ Full-width hero with no top margin */}
        <div className="w-full -mt-[1rem] sm:-mt-[1.2rem] md:-mt-[1.5rem]">
          <Header filters={filters} setFilters={setFilters} />
        </div>

        {/* Main content */}
        <div className="w-full max-w-6xl px-4 mt-2 sm:mt-4">
          <EventList filters={filters} />
        </div>

        {/* Footer */}
        <div className="w-full mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Home;
