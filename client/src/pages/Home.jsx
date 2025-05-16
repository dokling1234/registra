import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import EventList from './EventList';
import Footer from '../components/Footer';
import './Home.css'; //css home

const Home = () => {
  const [filters, setFilters] = useState({
    eventType: '',
    location: '',
    startDate: '',
    endDate: ''
  });

  const resetFilters = () => {
    setFilters({
      eventType: '',
      location: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="home-container">
      <Navbar resetFilters={resetFilters} />  
      <Header filters={filters} setFilters={setFilters} />
      <EventList filters={filters} />
      <Footer/>
    </div>
  );
};

export default Home;
