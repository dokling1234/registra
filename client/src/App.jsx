import React, { useEffect, useContext } from "react";
import { ToastContainer } from 'react-toastify';
import { AppContent } from "./context/AppContext";
import { AppContextProvider } from "./context/AppContext";
import { Routes, Route } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login'
import Home from './pages/Home'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import EventList from './pages/EventList';
import EventDetail from './components/EventDetail';
import RegisteredEvents from './pages/RegisteredEvents';
import RegisteredEventDetail from './components/RegisteredEventDetail';
import Profile from "./pages/Profile";
import AboutUs from "./pages/AboutUs";
import Map from "./pages/Map";
import AdminDashboard from './admin_pages/dashboard';
import AdminLogin from './admin_pages/AdminLogin';
import AddEvent from './admin_components/addevent';
import AllEvents from './admin_pages/EventList';
import AdminEventDetail from './admin_components/EventDetail';
import EditEvent from './admin_components/EditEvent';
import UserList from './admin_pages/UserList';
import Feedback from './admin_pages/Feedback';
import FeedbackBuilder from './admin_components/FeedbackBuilder';
import Certificate from "./admin_pages/Certificate";

const App = () => {
  return (
    <AppContextProvider>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/events" element={<EventList />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/register" element={<EventDetail />} />
        <Route path="/events/registered" element={<RegisteredEvents />} />
        <Route path="/events/registered/:id" element={<RegisteredEventDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/map" element={<Map />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="addevent" element={<AddEvent />} />
        <Route path="adminevents" element={<AllEvents />} />
        <Route path="events/:id" element={<AdminEventDetail />} />
        <Route path="/events/edit/:id" element={<EditEvent />} />
        <Route path="/userlist" element={<UserList />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="/feedback/Builder" element={<FeedbackBuilder />} />
        <Route path="certificate" element={<Certificate />} />


      </Routes>
    </AppContextProvider>
  );
};


export default App