import React from "react";
import { ToastContainer } from "react-toastify";
import { AppContextProvider } from "./context/AppContext";
import { Routes, Route } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

// pages / components
import Login from "./pages/Login";
import Home from "./pages/Home";
import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";

// ✅ Make sure this file exists (EventList or EventsList)
import EventList from "./pages/EventList"; // rename if your file is EventsList.jsx
import EventDetail from "./components/EventDetail";
import RegisteredEvents from "./pages/RegisteredEvents";
import RegisteredEventDetail from "./components/RegisteredEventDetail";
import Profile from "./pages/Profile";
import AboutUs from "./pages/AboutUs";
import Map from "./pages/Map";
import AdminDashboard from "./admin_pages/dashboard";
import AdminLogin from "./admin_pages/AdminLogin";
import Events from "./admin_pages/Events";
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
import SuperAdminEditEvent from "./superAdmin_components/EditEvent";
import SuperAdminUserList from "./superAdmin_pages/UserList";
import SuperAdminFeedback from "./superAdmin_pages/Feedback";
import SuperAdminFeedbackBuilder from "./superAdmin_components/FeedbackBuilder";
import SuperAdminCertificate from "./superAdmin_pages/Certificate";
import SuperAdminReport from "./superAdmin_pages/Report";
import SuperAdminReceipt from "./superAdmin_pages/Receipt";
import SuperAdminReschedule from "./superAdmin_components/Reschedule";
import SuperAdminAdminList from "./superAdmin_pages/AdminList";
import SplashScreen from "./components/SplashScreen";
import SuperAdminActivityLog from "./superAdmin_pages/ActivityLogs";
import AdminActivityLog from "./admin_pages/ActivityLogs";

const App = () => {
  return (
    <AppContextProvider>
      <ToastContainer />
      <Routes>
        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ---------------- EVENTS ROUTES ---------------- */}
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/register" element={<EventDetail />} />
        <Route path="/events/registered" element={<RegisteredEvents />} />
        <Route
          path="/events/registered/:id"
          element={<RegisteredEventDetail />}
        />

        {/* ---------------- USER ROUTES ---------------- */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/map" element={<Map />} />
        <Route path="/uploadreceipt/:id" element={<UploadReceipt />} />

        {/* ---------------- ADMIN ROUTES ---------------- */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/receipt" element={<Receipt />} />
        <Route path="/admin/report" element={<Report />} />
        <Route path="/admin/events" element={<Events />} />
        <Route path="/events/edit/:id" element={<EditEvent />} />
        <Route path="/userlist" element={<UserList />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/feedback/Builder" element={<FeedbackBuilder />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/admin/activity-logs" element={<AdminActivityLog />} />

        {/* ---------------- SUPER ADMIN ROUTES ---------------- */}
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/events" element={<SuperAdminEvents />} />
        <Route
          path="/superadmin/events/edit/:id"
          element={<SuperAdminEditEvent />}
        />
        <Route path="/superadmin/userlist" element={<SuperAdminUserList />} />
        <Route path="/superadmin/adminlist" element={<SuperAdminAdminList />} />
        <Route path="/superadmin/feedback" element={<SuperAdminFeedback />} />
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
        <Route
          path="/superadmin/activity-logs"
          element={<SuperAdminActivityLog />}
        />

        {/* ---------------- 404 FALLBACK ---------------- */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen text-center text-gray-700 px-4">
              <h1 className="text-5xl font-extrabold text-blue-700 mb-3">
                404
              </h1>
              <p className="text-xl font-semibold mb-2">Page Not Found</p>
              <p className="text-gray-500 mb-6">
                The page you are looking for doesn’t exist or has been moved.
              </p>
              <a
                href="/home"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
              >
                Back to Home
              </a>
            </div>
          }
        />
      </Routes>
    </AppContextProvider>
  );
};

export default App;
