import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../superAdmin_components/Sidebar";
import html2pdf from "html2pdf.js";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Bar, Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Report = () => {
  const navigate = useNavigate();
  const { userData, isAdmin } = useContext(AppContent);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const selectedEvent = filteredEvents.find((ev) => ev._id === selectedEventId);
  const [eventSummary, setEventSummary] = useState("");
  const [generatedReport, setGeneratedReport] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      // Not an admin, redirect to home or another page
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

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
      filtered = filtered.filter((e) => e.eventType === selectedType);
    }
    if (startDate) {
      filtered = filtered.filter(
        (e) => new Date(e.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter((e) => new Date(e.date) <= new Date(endDate));
    }
    setFilteredEvents(filtered);
  }, [events, selectedType, startDate, endDate]);

  const fetchFeedbackData = async (eventId) => {
    if (!eventId) return;
    
    setIsLoadingFeedback(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/feedback/getEventFeedbackData/${eventId}`,
        { withCredentials: false }
      );
      setFeedbackData(response.data);
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      setFeedbackData(null);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Process feedback data for charts - moved outside component for reuse
  const processQuestionData = (question, questionIndex, answers) => {
    const questionAnswers = answers.map(answer => answer.answers[questionIndex]);
    
    if (question.type === "Choice") {
      const optionCounts = {};
      questionAnswers.forEach(answer => {
        if (answer && answer.answer) {
          const value = answer.answer;
          optionCounts[value] = (optionCounts[value] || 0) + 1;
        }
      });
      return {
        type: "choice",
        labels: Object.keys(optionCounts),
        data: Object.values(optionCounts),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
      };
    } else if (question.type === "Likert") {
      // Handle Likert scale questions with statements
      const statementData = {};
      questionAnswers.forEach(answer => {
        if (answer && answer.answers && Array.isArray(answer.answers)) {
          answer.answers.forEach(statementAnswer => {
            if (statementAnswer.statement && statementAnswer.value) {
              if (!statementData[statementAnswer.statement]) {
                statementData[statementAnswer.statement] = { total: 0, count: 0 };
              }
              statementData[statementAnswer.statement].total += statementAnswer.value;
              statementData[statementAnswer.statement].count += 1;
            }
          });
        }
      });
      
      const statements = Object.keys(statementData);
      const averages = statements.map(stmt => 
        statementData[stmt].count > 0 
          ? (statementData[stmt].total / statementData[stmt].count).toFixed(1)
          : 0
      );
      
      return {
        type: "likert",
        labels: statements,
        data: averages,
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
      };
    } else if (question.type === "Rating") {
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      questionAnswers.forEach(answer => {
        if (answer && answer.answer) {
          const rating = parseInt(answer.answer);
          if (rating >= 1 && rating <= 5) {
            ratingCounts[rating]++;
          }
        }
      });
      return {
        type: "rating",
        labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
        data: Object.values(ratingCounts),
        backgroundColor: ["#ef4444", "#f59e0b", "#eab308", "#10b981", "#3b82f6"]
      };
    } else if (question.type === "Text") {
      return {
        type: "text",
        responses: questionAnswers.filter(answer => answer && answer.answer).map(answer => answer.answer)
      };
    }
    return null;
  };

  const getAverageRating = (questionIndex, answers) => {
    const questionAnswers = answers.map(answer => answer.answers[questionIndex]);
    const ratings = questionAnswers
      .filter(answer => answer && answer.answer)
      .map(answer => parseInt(answer.answer))
      .filter(rating => !isNaN(rating));
    
    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);
  };

  const handlePrint = () => {
    if (!generatedReport) return;

    const printContent = document.getElementById("printableReport");
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // reload page to restore state (optional but safe)
  };

  const handleDownload = () => {
    const element = document.getElementById("downloadableReport");
    const opt = {
      margin: 0.5,
      filename: `event-report-${generatedReport.title || "report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const AttendeePieChart = ({ registrations }) => {
    const counts = registrations.reduce(
      (acc, reg) => {
        const role = reg.userType?.toLowerCase();
        if (role === "student") acc.student += 1;
        else if (role === "professional") acc.professional += 1;
        else acc.others += 1;

        return acc;
      },
      { student: 0, professional: 0, others: 0 }
    );
    console.log("Attendee counts:", counts);
    const data = {
      labels: ["Student", "Professional", "Others"],
      datasets: [
        {
          label: "Attendees by Role",
          data: [counts.student, counts.professional, counts.others],
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="relative w-full" style={{ height: "300px" }}>
        <Pie data={data} options={{ maintainAspectRatio: false }} />
      </div>
    );
  };

  const FeedbackReport = ({ feedbackData }) => {
    if (!feedbackData || !feedbackData.form || !feedbackData.answers) {
      return (
        <div className="text-center py-8 text-gray-500">
          No feedback data available for this event.
        </div>
      );
    }

    const { form, answers, totalResponses } = feedbackData;

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Feedback Report</h2>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Feedback Summary</h3>
          <p><strong>Total Responses:</strong> {totalResponses}</p>
          <p><strong>Response Rate:</strong> {totalResponses > 0 ? `${((totalResponses / (selectedEvent?.registrations?.length || 1)) * 100).toFixed(1)}%` : '0%'}</p>
        </div>

        {form.questions.map((question, index) => {
          const questionData = processQuestionData(question, index, answers);
          
          if (!questionData) return null;

          return (
            <div key={index} className="mb-8 p-6 bg-white rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4">{question.text || `Question ${index + 1}`}</h4>
              
              {questionData.type === "choice" && (
                <div>
                  <div className="mb-4">
                    <Bar
                      data={{
                        labels: questionData.labels,
                        datasets: [{
                          label: 'Responses',
                          data: questionData.data,
                          backgroundColor: questionData.backgroundColor.slice(0, questionData.labels.length),
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                          }
                        }
                      }}
                      height={100}
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {questionData.labels.map((label, i) => (
                      <div key={i} className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-semibold">{label}</div>
                        <div className="text-2xl text-blue-600">{questionData.data[i]}</div>
                        <div className="text-sm text-gray-500">
                          {((questionData.data[i] / totalResponses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questionData.type === "rating" && (
                <div>
                  <div className="mb-4">
                    <Bar
                      data={{
                        labels: questionData.labels,
                        datasets: [{
                          label: 'Responses',
                          data: questionData.data,
                          backgroundColor: questionData.backgroundColor,
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                          }
                        }
                      }}
                      height={100}
                    />
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      Average Rating: {getAverageRating(index, answers)} ⭐
                    </div>
                  </div>
                </div>
              )}

              {questionData.type === "likert" && (
                <div>
                  <div className="mb-4">
                    <Bar
                      data={{
                        labels: questionData.labels,
                        datasets: [{
                          label: 'Average Score',
                          data: questionData.data,
                          backgroundColor: questionData.backgroundColor.slice(0, questionData.labels.length),
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: { stepSize: 1 }
                          }
                        }
                      }}
                      height={100}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionData.labels.map((label, i) => (
                      <div key={i} className="text-center p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                        <div className="font-semibold text-sm mb-1">{label}</div>
                        <div className="text-2xl text-purple-600">{questionData.data[i]}</div>
                        <div className="text-xs text-gray-500">Average Score</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questionData.type === "text" && (
                <div>
                  <div className="mb-4">
                    <div className="text-lg font-semibold text-blue-600 mb-2">
                      Text Responses ({questionData.responses.length})
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {questionData.responses.map((response, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700">"{response}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Feedback Insights Summary */}
        {feedbackData && (
          <div className="mt-6 p-4 bg-gray-50 rounded border">
            <h3 className="text-lg font-semibold mb-3">Feedback Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Response Analysis</h4>
                <p className="text-sm">
                  • Total feedback responses: <strong>{feedbackData.totalResponses}</strong><br/>
                  • Response rate: <strong>{feedbackData.totalResponses > 0 ? `${((feedbackData.totalResponses / (selectedEvent?.registrations?.length || 1)) * 100).toFixed(1)}%` : '0%'}</strong><br/>
                  • Questions answered: <strong>{feedbackData.form.questions.length}</strong>
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Key Takeaways</h4>
                <p className="text-sm">
                  • {feedbackData.totalResponses > 0 ? 'Feedback data available for analysis' : 'No feedback responses yet'}<br/>
                  • {feedbackData.form.questions.filter(q => q.type === 'Rating' || q.type === 'Likert').length > 0 ? 'Quantitative feedback collected' : 'No quantitative questions'}<br/>
                  • {feedbackData.form.questions.filter(q => q.type === 'Text').length > 0 ? 'Qualitative feedback available' : 'No text-based questions'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
                <p className="text-lg font-semibold text-gray-800">
                  {userData.fullName}
                </p>
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
            <label
              htmlFor="eventType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
              {eventTypes
                .filter(
                  (type) =>
                    type !== "All" && type !== "Seminar" && type !== "Webinar"
                )
                .map((type, idx) => (
                  <option key={idx} value={type}>
                    {type}
                  </option>
                ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                  const attended = registrations.filter(
                    (r) => r.attended === true
                  ).length;
                  const notAttended = registered - attended;
                  const cost =
                    event.cost !== undefined && event.cost !== ""
                      ? Number(event.cost)
                      : 0;
                  const income = registrations.reduce((sum, reg) => {
                    if (reg.paymentStatus === "paid") {
                      return (
                        sum +
                        (reg.price !== undefined
                          ? Number(reg.price)
                          : event.price || 0)
                      );
                    }
                    return sum;
                  }, 0);
                  const revenue = income - cost;
                  const price =
                    event.price !== undefined && event.price !== ""
                      ? Number(event.price)
                      : 0;
                  return (
                    <tr
                      key={idx}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">{event.title}</td>
                      <td className="px-6 py-4">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">₱{price}</td>
                      <td className="px-6 py-4">{registered}</td>
                      <td className="px-6 py-4">{attended}</td>
                      <td className="px-6 py-4">{notAttended}</td>
                      <td className="px-6 py-4">₱{cost}</td>
                      <td className="px-6 py-4">₱{income}</td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          revenue >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₱{revenue}
                      </td>
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
                  <td
                    colSpan="8"
                    className="text-center px-6 py-4 text-gray-500"
                  >
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
                  const incomeA =
                    (a.registrations?.length || 0) * (a.price || 0);
                  const incomeB =
                    (b.registrations?.length || 0) * (b.price || 0);
                  return incomeB - incomeA;
                })
                .map((e) => e.title),
              datasets: [
                {
                  label: "Income (₱)",
                  data: filteredEvents
                    .slice()
                    .sort(
                      (a, b) =>
                        (b.registrations?.length || 0) * (b.price || 0) -
                        (a.registrations?.length || 0) * (a.price || 0)
                    )
                    .map(
                      (e) => (e.registrations?.length || 0) * (e.price || 0)
                    ),
                  backgroundColor: "rgba(37, 99, 235, 0.7)",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: {
                  display: true,
                  text: "Events by Income (High to Low)",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Income (₱)" },
                },
                x: { title: { display: true, text: "Event" } },
              },
            }}
            height={100}
          />
        </div>

        {/* Generate Report Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Generate Event Report</h2>
          <div className="mb-4">
            <label
              htmlFor="selectEvent"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Choose Event:
            </label>
            <select
              id="selectEvent"
              className="p-2 border border-gray-300 rounded-md w-full max-w-md"
              value={selectedEventId || ""}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Select an Event --</option>
              {filteredEvents.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
          {/* Prompt for what happened */}
          <div className="mb-4">
            <label
              htmlFor="eventSummary"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              What happened in the event?
            </label>
            <textarea
              id="eventSummary"
              className="p-2 border border-gray-300 rounded-md w-full max-w-md min-h-[80px]"
              placeholder="Type a brief summary of what happened in the event..."
              value={eventSummary}
              onChange={(e) => setEventSummary(e.target.value)}
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
              // Fetch feedback data when generating report
              fetchFeedbackData(selectedEvent._id);
            }}
            disabled={!selectedEventId}
          >
            Generate Complete Report
          </button>

          {/* Loading indicator */}
          {isLoadingFeedback && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600">Loading feedback data...</span>
              </div>
            </div>
          )}

          {/* Feedback Data Status */}
          {feedbackData && (
            <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">✓</span>
                <span className="text-green-700">
                  Feedback data loaded ({feedbackData.totalResponses} responses)
                </span>
              </div>
            </div>
          )}

          {selectedEvent && generatedReport && (
            <div>
              <div
                id="downloadableReport"
                className="bg-white p-8 rounded shadow-md text-black max-w-4xl mx-auto"
                style={{
                  '@media print': {
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '20px',
                    margin: '0',
                    boxShadow: 'none',
                    borderRadius: '0'
                  }
                }}
              >
                <h1 className="text-2xl font-bold mb-4 text-center">
                  Event Report
                </h1>

                <div className="mb-4">
                  <p>
                    <strong>Event Name:</strong> {generatedReport.title}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(generatedReport.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Location:</strong> {generatedReport.location}
                  </p>
                  <p>
                    <strong>Type:</strong> {generatedReport.eventType || "N/A"}
                  </p>
                </div>

                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">
                    Attendance Summary
                  </h2>
                  <p>
                    <strong>Total Registrations:</strong>{" "}
                    {generatedReport.registrations?.length || 0}
                  </p>
                  <p>
                    <strong>Attended:</strong>{" "}
                    {generatedReport.registrations?.filter((r) => r.attended)
                      .length || 0}
                  </p>
                  <p>
                    <strong>Not Attended:</strong>{" "}
                    {(generatedReport.registrations?.length || 0) -
                      (generatedReport.registrations?.filter((r) => r.attended)
                        .length || 0)}
                  </p>
                </div>

                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">
                    Financial Summary
                  </h2>
                  <p>
                    <strong>Price per Registration:</strong> ₱
                    {generatedReport.price || 0}
                  </p>
                  <p>
                    <strong>Total Cost:</strong> ₱{generatedReport.cost || 0}
                  </p>
                  <p>
                    <strong>Total Income:</strong> ₱
                    {generatedReport.registrations?.reduce(
                      (sum, reg) =>
                        reg.paymentStatus === "paid"
                          ? sum +
                            (reg.price !== undefined
                              ? Number(reg.price)
                              : generatedReport.price || 0)
                          : sum,
                      0
                    )}
                  </p>
                  <p>
                    <strong>Net Revenue:</strong> ₱
                    {generatedReport.registrations?.reduce(
                      (sum, reg) =>
                        reg.paymentStatus === "paid"
                          ? sum +
                            (reg.price !== undefined
                              ? Number(reg.price)
                              : generatedReport.price || 0)
                          : sum,
                      0
                    ) - (generatedReport.cost || 0)}
                  </p>
                </div>
                <AttendeePieChart
                  registrations={generatedReport.registrations || []}
                />

                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">
                    Summary & Insights
                  </h2>
                  <p>
                    {generatedReport.eventSummary || "No summary available."}
                  </p>
                  <p className="mt-2">
                    {(() => {
                      const income = generatedReport.registrations?.reduce(
                        (sum, reg) =>
                          reg.paymentStatus === "paid"
                            ? sum +
                              (reg.price !== undefined
                                ? Number(reg.price)
                                : generatedReport.price || 0)
                            : sum,
                        0
                      );
                      const revenue = income - (generatedReport.cost || 0);
                      if (revenue > 0)
                        return `✅ The event was profitable, earning ₱${revenue.toLocaleString()}.`;
                      if (revenue < 0)
                        return `⚠️ The event incurred a loss of ₱${Math.abs(
                          revenue
                        ).toLocaleString()}.`;
                      return `The event broke even.`;
                    })()}
                  </p>
                </div>

                {/* Feedback Report Section */}
                {feedbackData && (
                  <div className="mb-4" style={{ pageBreakBefore: 'always' }}>
                    <h2 className="text-lg font-semibold mb-2">Feedback Report</h2>
                    <div className="mb-4 p-4 bg-blue-50 rounded">
                      <h3 className="text-md font-semibold mb-2">Feedback Summary</h3>
                      <p><strong>Total Responses:</strong> {feedbackData.totalResponses}</p>
                      <p><strong>Response Rate:</strong> {feedbackData.totalResponses > 0 ? `${((feedbackData.totalResponses / (selectedEvent?.registrations?.length || 1)) * 100).toFixed(1)}%` : '0%'}</p>
                    </div>

                    {feedbackData.form.questions.map((question, index) => {
                      const questionData = processQuestionData(question, index, feedbackData.answers);
                      
                      if (!questionData) return null;

                      return (
                        <div key={index} className="mb-6 p-4 border rounded">
                          <h4 className="text-md font-semibold mb-3">{question.text || `Question ${index + 1}`}</h4>
                          
                          {questionData.type === "choice" && (
                            <div>
                              <div className="mb-3">
                                <Bar
                                  data={{
                                    labels: questionData.labels,
                                    datasets: [{
                                      label: 'Responses',
                                      data: questionData.data,
                                      backgroundColor: questionData.backgroundColor.slice(0, questionData.labels.length),
                                    }]
                                  }}
                                  options={{
                                    responsive: true,
                                    plugins: {
                                      legend: { display: false },
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        ticks: { stepSize: 1 }
                                      }
                                    }
                                  }}
                                  height={80}
                                />
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {questionData.labels.map((label, i) => (
                                  <div key={i} className="text-center p-2 bg-gray-50 rounded">
                                    <div className="font-semibold text-xs">{label}</div>
                                    <div className="text-lg text-blue-600">{questionData.data[i]}</div>
                                    <div className="text-xs text-gray-500">
                                      {((questionData.data[i] / feedbackData.totalResponses) * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {questionData.type === "rating" && (
                            <div>
                              <div className="mb-3">
                                <Bar
                                  data={{
                                    labels: questionData.labels,
                                    datasets: [{
                                      label: 'Responses',
                                      data: questionData.data,
                                      backgroundColor: questionData.backgroundColor,
                                    }]
                                  }}
                                  options={{
                                    responsive: true,
                                    plugins: {
                                      legend: { display: false },
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        ticks: { stepSize: 1 }
                                      }
                                    }
                                  }}
                                  height={80}
                                />
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded">
                                <div className="text-lg font-bold text-yellow-600">
                                  Average Rating: {getAverageRating(index, feedbackData.answers)} ⭐
                                </div>
                              </div>
                            </div>
                          )}

                          {questionData.type === "likert" && (
                            <div>
                              <div className="mb-3">
                                <Bar
                                  data={{
                                    labels: questionData.labels,
                                    datasets: [{
                                      label: 'Average Score',
                                      data: questionData.data,
                                      backgroundColor: questionData.backgroundColor.slice(0, questionData.labels.length),
                                    }]
                                  }}
                                  options={{
                                    responsive: true,
                                    plugins: {
                                      legend: { display: false },
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        max: 5,
                                        ticks: { stepSize: 1 }
                                      }
                                    }
                                  }}
                                  height={80}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {questionData.labels.map((label, i) => (
                                  <div key={i} className="text-center p-2 bg-purple-50 rounded border-l-2 border-purple-500">
                                    <div className="font-semibold text-xs mb-1">{label}</div>
                                    <div className="text-lg text-purple-600">{questionData.data[i]}</div>
                                    <div className="text-xs text-gray-500">Average Score</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {questionData.type === "text" && (
                            <div>
                              <div className="mb-3">
                                <div className="text-md font-semibold text-blue-600 mb-2">
                                  Text Responses ({questionData.responses.length})
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {questionData.responses.map((response, i) => (
                                  <div key={i} className="p-2 bg-gray-50 rounded border-l-2 border-blue-500 text-sm">
                                    <p className="text-gray-700">"{response}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">
                    Summary & Insights
                  </h2>
                  <p>
                    {generatedReport.eventSummary || "No summary available."}
                  </p>
                  <p className="mt-2">
                    {(() => {
                      const income = generatedReport.registrations?.reduce(
                        (sum, reg) =>
                          reg.paymentStatus === "paid"
                            ? sum +
                              (reg.price !== undefined
                                ? Number(reg.price)
                                : generatedReport.price || 0)
                            : sum,
                        0
                      );
                      const revenue = income - (generatedReport.cost || 0);
                      if (revenue > 0)
                        return `✅ The event was profitable, earning ₱${revenue.toLocaleString()}.`;
                      if (revenue < 0)
                        return `⚠️ The event incurred a loss of ₱${Math.abs(
                          revenue
                        ).toLocaleString()}.`;
                      return `The event broke even.`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex justify-center mt-6 gap-4">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                  Download PDF
                </button>
                {feedbackData && (
                  <button
                    onClick={() => {
                      const feedbackSection = document.getElementById("downloadableReport");
                      if (feedbackSection) {
                        const originalContents = document.body.innerHTML;
                        document.body.innerHTML = feedbackSection.innerHTML;
                        window.print();
                        document.body.innerHTML = originalContents;
                        window.location.reload();
                      }
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                  >
                    Print Report with Feedback
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Report */}
        {selectedEvent && feedbackData && (
          <FeedbackReport feedbackData={feedbackData} />
        )}
      </main>
    </div>
  );
};

export default Report;