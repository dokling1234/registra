import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from "../superAdmin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [incomeData, setIncomeData] = useState({ labels: [], data: [] });
  const [registrationData, setRegistrationData] = useState({
    labels: [],
    data: [],
  });
  const [eventTypeData, setEventTypeData] = useState({ labels: [], data: [] });

  const { userData, isAdmin } = useContext(AppContent);

  useEffect(() => {
    if (!isAdmin) {
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("userData");
      localStorage.removeItem("isLoggedin");
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/alldata`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setTotalUsers(response.data.count);
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
      }
    };
    fetchUsers();
  }, []);

  // Fetch Admins
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/admins`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setTotalAdmins(response.data.count);
        }
      } catch (error) {
        console.error("Error fetching admins:", error.message);
      }
    };
    fetchAdmins();
  }, []);

  // Fetch Events and Chart Data
  useEffect(() => {
    const fetchEventsAndRegistrations = async () => {
      try {
        const res = await axios.get("/api/events");
        const eventsData = res.data.events || [];
        setTotalEvents(eventsData.length);

        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return d.toLocaleString("default", { month: "short" });
        }).reverse();

        const monthlyIncome = {};
        last6Months.forEach((m) => (monthlyIncome[m] = 0));
        const eventRegistrations = {};
        const eventTypes = {};

        eventsData.forEach((event) => {
          if (Array.isArray(event.registrations)) {
            event.registrations.forEach((reg) => {
              if (reg.paymentStatus === "paid") {
                const regDate = new Date(reg.registeredAt || event.date);
                const month = regDate.toLocaleString("default", {
                  month: "short",
                });
                if (last6Months.includes(month)) {
                  monthlyIncome[month] += event.price || 0;
                }
              }
            });
            eventRegistrations[event.title] = event.registrations.length;
            const type = event.eventType || "Other";
            eventTypes[type] = (eventTypes[type] || 0) + 1;
          }
        });

        setIncomeData({
          labels: last6Months,
          data: last6Months.map((m) => monthlyIncome[m]),
        });

        const sortedEvents = Object.entries(eventRegistrations)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        setRegistrationData({
          labels: sortedEvents.map(([title]) => title),
          data: sortedEvents.map(([, count]) => count),
        });

        setEventTypeData({
          labels: Object.keys(eventTypes),
          data: Object.values(eventTypes),
        });
      } catch (err) {
        console.error("Error fetching events:", err.message);
      }
    };
    fetchEventsAndRegistrations();
  }, []);

  return (
    <div className="flex flex-col xl:flex-row min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 xl:ml-64 overflow-y-auto max-w-full">
        <main className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <button
                className="xl:hidden bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 transition"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? "✖" : "☰"}
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold ml-2 text-gray-900">
                Dashboard
              </h1>
            </div>

            {userData ? (
              <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-base sm:text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Welcome back,
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-800">
                    {userData.fullName}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-4 py-2 sm:px-6 text-gray-800 hover:bg-gray-100 transition-all text-sm sm:text-base justify-center"
              >
                Login <img src={assets.arrow_icon} alt="" />
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {[
              { label: "Total Users", value: totalUsers },
              { label: "Events", value: totalEvents },
              { label: "Total Admin", value: totalAdmins },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-all text-center"
              >
                <p className="text-gray-500 text-sm sm:text-base mb-2">
                  {stat.label}
                </p>
                <h2 className="text-3xl font-bold text-gray-800">
                  {stat.value}
                </h2>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-max">
            {/* Income Trend Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-all lg:col-span-2">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
                Income Trend (Last 6 Months)
              </h2>
              <div className="relative w-full h-[250px] sm:h-[300px]">
                <Line
                  data={{
                    labels: incomeData.labels,
                    datasets: [
                      {
                        label: "Monthly Income (₱)",
                        data: incomeData.data,
                        borderColor: "rgb(75, 192, 192)",
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            {/* Event Registrations Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-all">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
                Top Events by Registrations
              </h2>
              <div className="relative w-full h-[250px] sm:h-[300px]">
                <Bar
                  data={{
                    labels: registrationData.labels,
                    datasets: [
                      {
                        label: "Registrations",
                        data: registrationData.data,
                        backgroundColor: "rgba(54, 162, 235, 0.8)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            {/* Event Type Distribution Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-all">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
                Event Type Distribution
              </h2>
              <div className="relative w-full h-[250px] sm:h-[300px]">
                <Pie
                  data={{
                    labels: eventTypeData.labels,
                    datasets: [
                      {
                        data: eventTypeData.data,
                        backgroundColor: [
                          "rgba(255, 99, 132, 0.5)",
                          "rgba(54, 162, 235, 0.5)",
                          "rgba(255, 206, 86, 0.5)",
                          "rgba(75, 192, 192, 0.5)",
                          "rgba(153, 102, 255, 0.5)",
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
