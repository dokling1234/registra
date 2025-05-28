import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import Sidebar from '../superAdmin_components/Sidebar';
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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

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

const Home = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [incomeData, setIncomeData] = useState({ labels: [], data: [] });
  const [registrationData, setRegistrationData] = useState({ labels: [], data: [] });
  const [eventTypeData, setEventTypeData] = useState({ labels: [], data: [] });
  const { userData } = useContext(AppContent);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/alldata`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setTotalUsers(response.data.count);
        } else {
          console.error("Failed to fetch users:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/admins`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setTotalAdmins(response.data.count);
        } else {
          console.error("Failed to fetch events:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching events:", error.message);
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    const fetchEventsAndRegistrations = async () => {
      try {
        const res = await axios.get("/api/events");
        const eventsData = res.data.events || [];
        setTotalEvents(eventsData.length);

        // Process data for charts
        const now = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return d.toLocaleString('default', { month: 'short' });
        }).reverse();

        // Income data for line chart
        const monthlyIncome = {};
        last6Months.forEach(month => monthlyIncome[month] = 0);

        // Registration data for bar chart
        const eventRegistrations = {};
        
        // Event type data for pie chart
        const eventTypes = {};

        eventsData.forEach(event => {
          if (Array.isArray(event.registrations)) {
            // Process income data
            event.registrations.forEach(reg => {
              if (reg.paymentStatus === 'paid') {
                const regDate = new Date(reg.registeredAt || event.date);
                const month = regDate.toLocaleString('default', { month: 'short' });
                if (last6Months.includes(month)) {
                  monthlyIncome[month] += event.price || 0;
                }
              }
            });

            // Process registration data
            eventRegistrations[event.title] = event.registrations.length;

            // Process event type data
            const type = event.eventType || 'Other';
            eventTypes[type] = (eventTypes[type] || 0) + 1;
          }
        });

        // Set income data
        setIncomeData({
          labels: last6Months,
          data: last6Months.map(month => monthlyIncome[month])
        });

        // Set registration data
        const sortedEvents = Object.entries(eventRegistrations)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
        setRegistrationData({
          labels: sortedEvents.map(([title]) => title),
          data: sortedEvents.map(([,count]) => count)
        });

        // Set event type data
        setEventTypeData({
          labels: Object.keys(eventTypes),
          data: Object.values(eventTypes)
        });
      } catch (err) {
        console.error("Error fetching events/registrations:", err.response?.data || err.message);
      }
    };
    fetchEventsAndRegistrations();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64">
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {userData ? (
              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Welcome back,</p>
                  <p className="text-lg font-semibold text-gray-800">{userData.fullName}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
              >
                Login <img src={assets.arrow_icon} alt="" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Total Users</p>
              <h2 className="text-3xl font-bold">{totalUsers}</h2>
            </div>
           
            {/* Card 2 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Events</p>
              <h2 className="text-3xl font-bold">{totalEvents}</h2>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 mb-2">Total Admin</p>
              <h2 className="text-3xl font-bold">{totalAdmins}</h2>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Income Trend (Last 6 Months)</h2>
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: incomeData.labels,
                    datasets: [{
                      label: 'Monthly Income (₱)',
                      data: incomeData.data,
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: value => '₱' + value.toLocaleString()
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Event Registrations Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Top Events by Registrations</h2>
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: registrationData.labels,
                    datasets: [{
                      label: 'Number of Registrations',
                      data: registrationData.data,
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                      borderColor: 'rgb(54, 162, 235)',
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: false 
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Registrations: ${context.raw}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          precision: 0
                        },
                        title: {
                          display: true,
                          text: 'Number of Registrations'
                        }
                      },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Event Type Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Event Type Distribution</h2>
              <div className="h-[300px]">
                <Pie
                  data={{
                    labels: eventTypeData.labels,
                    datasets: [{
                      data: eventTypeData.data,
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                      ],
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'right',
                        labels: {
                          boxWidth: 15,
                          padding: 10
                        }
                      }
                    }
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

export default Home;
