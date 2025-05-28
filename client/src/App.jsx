import React, { useEffect, useContext } from "react";
import { ToastContainer } from "react-toastify";
import { AppContent } from "./context/AppContext";
import { AppContextProvider } from "./context/AppContext";
import { Routes, Route } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";
import EventList from "./pages/EventList";
import EventDetail from "./components/EventDetail";
import RegisteredEvents from "./pages/RegisteredEvents";
import RegisteredEventDetail from "./components/RegisteredEventDetail";
import Profile from "./pages/Profile";
import AboutUs from "./pages/AboutUs";
import Map from "./pages/Map";
import AdminDashboard from "./admin_pages/dashboard";
import AdminLogin from "./admin_pages/AdminLogin";
import Events from "./admin_pages/Events";
import AdminEventDetail from "./admin_components/EventDetail";
import EditEvent from "./admin_components/EditEvent";
import UserList from "./admin_pages/UserList";
import Feedback from "./admin_pages/Feedback";
import FeedbackBuilder from "./admin_components/FeedbackBuilder";
import Certificate from "./admin_pages/Certificate";
import UploadReceipt from "./pages/UploadReceipt";
import Report from "./admin_pages/Report";
import Receipt from "./admin_pages/Receipt";
import SuperAdminDashboard from "./superAdmin_pages/dashboard";
import SuperAdminEvents from "./superAdmin_pages/Events";
import SuperAdminEventDetail from "./superAdmin_components/EventDetail";
import SuperAdminEditEvent from "./superAdmin_components/EditEvent";
import SuperAdminUserList from "./superAdmin_pages/UserList";
import SuperAdminFeedback from "./superAdmin_pages/Feedback";
import SuperAdminFeedbackBuilder from "./superAdmin_components/FeedbackBuilder";
import SuperAdminCertificate from "./superAdmin_pages/Certificate";
import SuperAdminReport from "./superAdmin_pages/Report";
import SuperAdminReceipt from "./superAdmin_pages/Receipt";
import SuperAdminReschedule from "./superAdmin_components/Reschedule";

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
        <Route
          path="/events/registered/:id"
          element={<RegisteredEventDetail />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/map" element={<Map />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/receipt" element={<Receipt />} />
        <Route path="admin/report" element={<Report />} />
        <Route path="/admin/events" element={<Events />} />
        <Route path="adminevents/:id" element={<AdminEventDetail />} />
        <Route path="/events/edit/:id" element={<EditEvent />} />
        <Route path="/userlist" element={<UserList />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="/feedback/Builder" element={<FeedbackBuilder />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/uploadreceipt/:id" element={<UploadReceipt />} />
        <Route path="/report" element={<SuperAdminReport />} />
        <Route path="/receipt" element={<SuperAdminReceipt />} />
        <Route path="superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/events" element={<SuperAdminEvents />} />
        <Route
          path="superadmin/events/:id"
          element={<SuperAdminEventDetail />}
        />
        <Route
          path="/superadmin/events/edit/:id"
          element={<SuperAdminEditEvent />}
        />
        <Route path="/superadmin/userlist" element={<SuperAdminUserList />} />
        <Route path="superadmin/feedback" element={<SuperAdminFeedback />} />
        <Route
          path="/superadmin/feedback/Builder"
          element={<SuperAdminFeedbackBuilder />}
        />
        <Route
          path="/superadmin/certificate"
          element={<SuperAdminCertificate />}
        />
        <Route path="/superadmin/report" element={<SuperAdminReport />} />
        <Route path="/superadmin/receipt" element={<SuperAdminReceipt />} />
        <Route
          path="/superadmin/events/reschedule/:id"
          element={<SuperAdminReschedule />}
        />
        <Route path="*" element={<div>Page Not Found or Catch-All</div>} />

      </Routes>
    </AppContextProvider>
  );
};

export default App;
