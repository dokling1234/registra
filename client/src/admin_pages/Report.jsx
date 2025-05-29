import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../admin_components/Sidebar";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Report = () => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContent);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const selectedEvent = filteredEvents.find(ev => ev._id === selectedEventId);
  const [eventSummary, setEventSummary] = useState("");
  const [generatedReport, setGeneratedReport] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/events`,
          { withCredentials: false }
        );
        if (response.data.success) {
          setEvents(response.data.events || []);
        } else {
          setEvents([]);
        }
      } catch (error) {
        setEvents([]);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;
    if (selectedType !== "All") {
      filtered = filtered.filter(e => e.eventType === selectedType);
    }
    if (startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(endDate));
    }
    setFilteredEvents(filtered);
  }, [events, selectedType, startDate, endDate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Event Attendance Report</h1>
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
              onClick={() => navigate("/")}
              className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
            >
              Login <img src={assets.arrow_icon} alt="Arrow Icon" />
            </button>
          )}
        </div>

        {/* Filters and Date Range */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 w-full">
          {/* Filter Dropdown */}
          <div className="flex-1">
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Event Type:
            </label>
            <select
              id="eventType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="All">All Event Types</option>
              {/* Manually add Seminar and Webinar options */}
              <option value="Seminar">Seminar</option>
              <option value="Webinar">Webinar</option>
              {/* Filter out All if it exists in fetched types, map others */}
              {eventTypes.filter(type => type !== "All" && type !== "Seminar" && type !== "Webinar").map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-200 text-xs uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Price (₱)</th>
                <th className="px-6 py-3">Registered</th>
                <th className="px-6 py-3">Attended</th>
                <th className="px-6 py-3">Not Attended</th>
                <th className="px-6 py-3">Cost (₱)</th>
                <th className="px-6 py-3">Income (₱)</th>
                <th className="px-6 py-3">Revenue (₱)</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, idx) => {
                  const registrations = event.registrations || [];
                  const registered = registrations.length;
                  const attended = registrations.filter(r => r.attended === true).length;
                  const notAttended = registered - attended;
                  const cost = event.cost !== undefined && event.cost !== "" ? Number(event.cost) : 0;
                  const income = registrations.reduce((sum, reg) => {
                    if (reg.paymentStatus === 'paid') {
                      return sum + (reg.price !== undefined ? Number(reg.price) : (event.price || 0));
                    }
                    return sum;
                  }, 0);
                  const revenue = income - cost;
                  const price = event.price !== undefined && event.price !== "" ? Number(event.price) : 0;
                  return (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{event.title}</td>
                      <td className="px-6 py-4">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">₱{price}</td>
                      <td className="px-6 py-4">{registered}</td>
                      <td className="px-6 py-4">{attended}</td>
                      <td className="px-6 py-4">{notAttended}</td>
                      <td className="px-6 py-4">₱{cost}</td>
                      <td className="px-6 py-4">₱{income}</td>
                      <td className={`px-6 py-4 font-medium ${revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>₱{revenue}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/events/${event._id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center px-6 py-4 text-gray-500">
                    No events found for selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Analytics Chart */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Event Income Analytics</h2>
          <Bar
            data={{
              labels: filteredEvents
                .slice()
                .sort((a, b) => {
                  const incomeA = (a.registrations?.length || 0) * (a.price || 0);
                  const incomeB = (b.registrations?.length || 0) * (b.price || 0);
                  return incomeB - incomeA;
                })
                .map(e => e.title),
              datasets: [
                {
                  label: 'Income (₱)',
                  data: filteredEvents
                    .slice()
                    .sort((a, b) => ((b.registrations?.length || 0) * (b.price || 0)) - ((a.registrations?.length || 0) * (a.price || 0)))
                    .map(e => (e.registrations?.length || 0) * (e.price || 0)),
                  backgroundColor: 'rgba(37, 99, 235, 0.7)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Events by Income (High to Low)' },
              },
              scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Income (₱)' } },
                x: { title: { display: true, text: 'Event' } },
              },
            }}
            height={100}
          />
        </div>

        {/* Generate Report Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Generate Event Report</h2>
          <div className="mb-4">
            <label htmlFor="selectEvent" className="block text-sm font-medium text-gray-700 mb-1">Choose Event:</label>
            <select
              id="selectEvent"
              className="p-2 border border-gray-300 rounded-md w-full max-w-md"
              value={selectedEventId || ''}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Select an Event --</option>
              {filteredEvents.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
          </div>
          {/* Prompt for what happened */}
          <div className="mb-4">
            <label htmlFor="eventSummary" className="block text-sm font-medium text-gray-700 mb-1">What happened in the event?</label>
            <textarea
              id="eventSummary"
              className="p-2 border border-gray-300 rounded-md w-full max-w-md min-h-[80px]"
              placeholder="Type a brief summary of what happened in the event..."
              value={eventSummary}
              onChange={e => setEventSummary(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition mb-6"
            onClick={() => {
              if (!selectedEvent) return;
              setGeneratedReport({
                ...selectedEvent,
                eventSummary,
              });
            }}
            disabled={!selectedEventId}
          >
            Generate Report
          </button>
          {selectedEvent && generatedReport && generatedReport._id === selectedEvent._id && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-2">{generatedReport.title}</h3>
              <p className="text-gray-600 mb-1"><strong>Date:</strong> {new Date(generatedReport.date).toLocaleDateString()}</p>
              <p className="text-gray-600 mb-1"><strong>Location:</strong> {generatedReport.location}</p>
              <p className="text-gray-600 mb-1"><strong>Registered:</strong> {generatedReport.registrations?.length || 0}</p>
              <p className="text-gray-600 mb-1"><strong>Attended:</strong> {generatedReport.registrations?.filter(r => r.attended).length || 0}</p>
              <p className="text-gray-600 mb-1"><strong>Not Attended:</strong> {(generatedReport.registrations?.length || 0) - (generatedReport.registrations?.filter(r => r.attended).length || 0)}</p>
              <p className="text-gray-600 mb-1"><strong>Price per Registration:</strong> ₱{generatedReport.price || 0}</p>
              <p className="text-gray-600 mb-1"><strong>Cost:</strong> ₱{generatedReport.cost || 0}</p>
              <p className="text-gray-600 mb-1"><strong>Income:</strong> ₱{generatedReport.registrations?.reduce((sum, reg) => reg.paymentStatus === 'paid' ? sum + (reg.price !== undefined ? Number(reg.price) : (generatedReport.price || 0)) : sum, 0)}</p>
              <p className="text-gray-600 mb-1"><strong>Revenue:</strong> ₱{generatedReport.registrations?.reduce((sum, reg) => reg.paymentStatus === 'paid' ? sum + (reg.price !== undefined ? Number(reg.price) : (generatedReport.price || 0)) : sum, 0) - (generatedReport.cost || 0)}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <strong>Summary:</strong>
                <p className="mt-1 text-gray-700">
                  {generatedReport.eventSummary && (<span className="block mb-2">{generatedReport.eventSummary}</span>)}
                  {(() => {
                    const income = generatedReport.registrations?.reduce((sum, reg) => reg.paymentStatus === 'paid' ? sum + (reg.price !== undefined ? Number(reg.price) : (generatedReport.price || 0)) : sum, 0);
                    const revenue = income - (generatedReport.cost || 0);
                    if (revenue > 0) {
                      return `The event generated a profit of ₱${revenue.toLocaleString()}.`;
                    } else if (revenue < 0) {
                      return `The event incurred a loss of ₱${Math.abs(revenue).toLocaleString()}.`;
                    } else {
                      return 'The event broke even (no profit or loss).';
                    }
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Report;