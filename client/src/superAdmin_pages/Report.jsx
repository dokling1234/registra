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
  const [feedbackAnalytics, setFeedbackAnalytics] = useState(null);
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [showEventReport, setShowEventReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    // Only include past events; exclude ongoing/upcoming events
    filtered = filtered.filter((e) => new Date(e.date) < new Date());
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

  
  const analyzeFeedbackData = async (eventId, eventTitle) => {
    if (!eventId) return;
    
    setIsAnalyzingFeedback(true);
    setAnalyticsError(null);
    setFeedbackAnalytics(null);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/feedback/analyzeFeedback/${eventId}`,
        { eventTitle },
        { withCredentials: false }
      );
      
      if (response.data.success) {
        setFeedbackAnalytics(response.data.analytics);
      } else {
        setAnalyticsError(response.data.message || "Analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing feedback data:", error);
      setAnalyticsError(error.response?.data?.error || "Failed to analyze feedback data");
    } finally {
      setIsAnalyzingFeedback(false);
    }
  };

  const getAnalyzableTextResponsesCount = (fbData) => {
    try {
      if (!fbData || !fbData.form || !fbData.answers) return 0;
      let count = 0;
      fbData.form.questions.forEach((question, questionIndex) => {
        if (question.type === "Text") {
          fbData.answers.forEach((ans) => {
            const text = ans?.answers?.[questionIndex]?.answer?.trim();
            if (text && text.replace(/\s+/g, " ").length > 3) count += 1;
          });
        }
      });
      return count;
    } catch (_) {
      return 0;
    }
  };

  // Reset report and analytics when selecting a different event
  useEffect(() => {
    setGeneratedReport(null);
    setFeedbackData(null);
    setFeedbackAnalytics(null);
    setAnalyticsError(null);
    setIsAnalyzingFeedback(false);
    setIsLoadingFeedback(false);
    setEventSummary("");
    setShowEventReport(false);
  }, [selectedEventId]);

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

  const [graphsEventId, setGraphsEventId] = useState(null);
  const graphsEvent = graphsEventId ? filteredEvents.find(e => e._id === graphsEventId) : null;

  const getAttendanceChartData = (event) => {
    const registrations = event?.registrations || [];
    const attended = registrations.filter(r => r.attended === true).length;
    const total = registrations.length;
    const noShow = Math.max(total - attended, 0);
    return {
      labels: ["Attended", "No-show"],
      datasets: [{ data: [attended, noShow], backgroundColor: ["#3B82F6", "#F43F5E"], borderColor: ["#2563EB", "#E11D48"], borderWidth: 1 }]
    };
  };

  const getRoleChartData = (event) => {
    const registrations = event?.registrations || [];
    const counts = registrations.reduce(
      (acc, reg) => {
        const role = String(reg.userType || "others").toLowerCase();
        if (role === "student") acc.student += 1;
        else if (role === "professional") acc.professional += 1;
        else acc.others += 1;
        return acc;
      },
      { student: 0, professional: 0, others: 0 }
    );
    return {
      labels: ["Student", "Professional", "Others"],
      datasets: [{
        data: [counts.student, counts.professional, counts.others],
        backgroundColor: ["#22C55E", "#06B6D4", "#F59E0B"],
        borderColor: ["#16A34A", "#0891B2", "#D97706"],
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, boxWidth: 10 } },
      title: { display: false }
    }
  };

  // Controls and helpers for Event Analytics
  const [incomeMetric, setIncomeMetric] = useState("income"); // income | revenue | attendance
  const [sortDesc, setSortDesc] = useState(true);

  const getPaidIncome = (event) => {
    const registrations = event?.registrations || [];
    return registrations.reduce((sum, reg) => {
      if (reg.paymentStatus === "paid") {
        const price = reg.price !== undefined && reg.price !== "" ? Number(reg.price) : (event.price || 0);
        return sum + price;
      }
      return sum;
    }, 0);
  };

  const getEventMetric = (event) => {
    if (!event) return 0;
    const cost = event.cost !== undefined && event.cost !== "" ? Number(event.cost) : 0;
    if (incomeMetric === "attendance") return event?.registrations?.length || 0;
    const income = getPaidIncome(event);
    if (incomeMetric === "revenue") return income - cost;
    return income; // default income
  };

  const handleDownloadServerReport = async (eventId, title) => {
    try {
      setIsDownloading(true);
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/events/${eventId}/report`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `event-report-${title || "report"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
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
    const [activeTab, setActiveTab] = useState('summary');
    const [downloadingQ, setDownloadingQ] = useState(null);
    const [openGraph, setOpenGraph] = useState({});
    const [openResponses, setOpenResponses] = useState({});

    const buildQuestionPayload = (question, index) => {
      const dataObj = processQuestionData(question, index, answers);
      const base = {
        eventTitle: selectedEvent?.title || 'Event',
        questionTitle: question.text || `Question ${index + 1}`,
        totalResponses,
        questionType: question.type
      };
      if (dataObj?.type === 'choice' || dataObj?.type === 'rating' || dataObj?.type === 'likert') {
        return { ...base, labels: dataObj.labels || [], data: dataObj.data || [] };
      }
      if (dataObj?.type === 'text') {
        return { ...base, responses: dataObj.responses || [] };
      }
      return base;
    };

    const downloadQuestionPDF = async (qIndex, question) => {
      if (!selectedEventId) return;
      try {
        setDownloadingQ(qIndex);
        const payload = buildQuestionPayload(question, qIndex);
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/events/${selectedEventId}/feedback/${qIndex}/report`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to generate PDF');
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const safeTitle = (selectedEvent?.title || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        link.download = `feedback-q${qIndex + 1}-${safeTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.error('Question PDF download error:', e);
      } finally {
        setDownloadingQ(null);
      }
    };

    return (
      <div className="mt-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold">Feedback Report</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Responses</span> ({totalResponses})
            </div>
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button
                className={`px-3 py-1 text-sm ${activeTab === 'individual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setActiveTab('individual')}
              >
                Individual
              </button>
            </div>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Feedback Summary</h3>
          <p><strong>Total Responses:</strong> {totalResponses}</p>
          <p><strong>Response Rate:</strong> {totalResponses > 0 ? `${((totalResponses / (selectedEvent?.registrations?.length || 1)) * 100).toFixed(1)}%` : '0%'}</p>
        </div>

        {activeTab === 'summary' && form.questions.map((question, index) => {
          const questionData = processQuestionData(question, index, answers);
          
          if (!questionData) return null;

          return (
            <div key={index} className="mb-8 p-6 bg-white rounded-lg shadow relative">
              <h4 className="text-lg font-semibold mb-4 pr-60">{question.text || `Question ${index + 1}`}</h4>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {questionData.type !== 'text' && (
                  <button
                    className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => setOpenGraph((s) => ({ ...s, [index]: s[index] === false ? true : false }))}
                  >
                    {openGraph[index] === false ? 'Show Graph' : 'Hide Graph'}
                  </button>
                )}
                {questionData.type === 'text' && (
                  <button
                    className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => setOpenResponses((s) => ({ ...s, [index]: s[index] === false ? true : false }))}
                  >
                    {openResponses[index] === false ? 'Show Responses' : 'Hide Responses'}
                  </button>
                )}
                <button
                  className={`text-xs px-3 py-1 border border-gray-300 rounded ${downloadingQ === index ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  onClick={() => downloadQuestionPDF(index, question)}
                  disabled={downloadingQ === index}
                  aria-label="Download question as PDF"
                >
                  {downloadingQ === index ? 'Preparing...' : 'Download PDF'}
                </button>
              </div>

              {questionData.type === "choice" && (
                <div>
                  {openGraph[index] === false ? null : (
                    <>
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
                              title: { display: true, text: question.text || `Question ${index + 1}` },
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
                    </>
                  )}
                </div>
              )}

              {questionData.type === "rating" && (
                <div>
                  {openGraph[index] === false ? null : (
                    <>
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
                              title: { display: true, text: question.text || `Question ${index + 1}` },
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
                    </>
                  )}
                </div>
              )}

              {questionData.type === "likert" && (
                <div>
                  {openGraph[index] === false ? null : (
                    <>
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
                              title: { display: true, text: question.text || `Question ${index + 1}` },
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
                    </>
                  )}
                </div>
              )}

              {questionData.type === "text" && (
                <div>
                  {openResponses[index] === false ? (
                    <div className="text-sm text-gray-500">Responses hidden</div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <div className="text-lg font-semibold text-blue-600">
                           ({questionData.responses.length})  Responses
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {questionData.responses.map((response, i) => (
                          <div key={i} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                            <p className="text-sm text-gray-700">"{response}"</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeTab === 'individual' && (
          <div className="mt-4 space-y-6">
            {form.questions.map((question, qIndex) => (
              <div key={qIndex} className="p-6 bg-white rounded-lg shadow">
                <h4 className="text-lg font-semibold mb-3">{question.text || `Question ${qIndex + 1}`}</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {answers.map((ans, aIndex) => {
                    const a = ans?.answers?.[qIndex];
                    if (!a) return null;
                    if (question.type === 'Text') {
                      if (!a.answer) return null;
                      return (
                        <div key={aIndex} className="p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700">"{a.answer}"</p>
                        </div>
                      );
                    }
                    if (question.type === 'Choice' || question.type === 'Rating') {
                      if (!a.answer) return null;
                      return (
                        <div key={aIndex} className="p-2 bg-gray-50 rounded border-l-4 border-green-500">
                          <p className="text-sm text-gray-700">{String(a.answer)}</p>
                        </div>
                      );
                    }
                    if (question.type === 'Likert' && Array.isArray(a.answers)) {
                      return (
                        <div key={aIndex} className="p-2 bg-gray-50 rounded border-l-4 border-purple-500">
                          <ul className="text-sm text-gray-700 list-disc ml-5">
                            {a.answers.map((s, sIdx) => (
                              <li key={sIdx}>{s.statement}: {s.value}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const FeedbackAnalytics = ({ analytics, error, isLoading }) => {
    if (isLoading) {
      return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-600 font-medium">Analyzing feedback data...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-8 p-6 bg-red-50 rounded-lg shadow border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 font-semibold">⚠️</span>
            <h3 className="text-lg font-semibold text-red-800">Analysis Error</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      );
    }

    if (!analytics) {
      return null;
    }

    const getSentimentColor = (sentiment) => {
      switch (sentiment.toLowerCase()) {
        case 'positive': return 'text-green-600';
        case 'negative': return 'text-red-600';
        case 'neutral': return 'text-gray-600';
        case 'mixed': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    };

    const getSentimentIcon = (sentiment) => {
      switch (sentiment.toLowerCase()) {
        case 'positive': return '😊';
        case 'negative': return '😞';
        case 'neutral': return '😐';
        case 'mixed': return '😕';
        default: return '😐';
      }
    };

    const getQualityColor = (quality) => {
      switch (quality.toLowerCase()) {
        case 'high': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">AI-Powered Feedback Analytics</h2>
        
        {/* Summary Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Analysis Summary</h3>
          <p className="text-gray-700 leading-relaxed">{analytics.summary}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getSentimentIcon(analytics.sentiment)}</span>
              <h4 className="font-semibold text-blue-800">Sentiment</h4>
            </div>
            <p className={`text-lg font-bold ${getSentimentColor(analytics.sentiment)}`}>
              {analytics.sentiment.charAt(0).toUpperCase() + analytics.sentiment.slice(1)}
            </p>
            <p className="text-sm text-gray-600">
              Score: {(analytics.sentimentScore * 100).toFixed(0)}%
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Response Quality</h4>
            <p className={`text-lg font-bold ${getQualityColor(analytics.responseQuality)}`}>
              {analytics.responseQuality.charAt(0).toUpperCase() + analytics.responseQuality.slice(1)}
            </p>
            <p className="text-sm text-gray-600">
              {analytics.metadata?.textResponses || 0} text responses analyzed
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Analysis Date</h4>
            <p className="text-lg font-bold text-purple-600">
              {new Date(analytics.metadata?.analysisDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(analytics.metadata?.analysisDate).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Key Themes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Key Themes</h3>
          <div className="flex flex-wrap gap-2">
            {analytics.keyThemes.map((theme, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Frequently Mentioned Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {analytics.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Key Insights</h3>
          <div className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="text-gray-700">💡 {insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Recommendations</h3>
          <div className="space-y-2">
            {analytics.recommendations.map((recommendation, index) => (
              <div key={index} className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                <p className="text-gray-700">🎯 {recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        {analytics.metadata && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Analysis Metadata</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Responses:</span>
                <p className="font-semibold">{analytics.metadata.totalResponses}</p>
              </div>
              <div>
                <span className="text-gray-600">Text Responses:</span>
                <p className="font-semibold">{analytics.metadata.textResponses}</p>
              </div>
              <div>
                <span className="text-gray-600">Event:</span>
                <p className="font-semibold">{analytics.metadata.eventTitle}</p>
              </div>
              <div>
                <span className="text-gray-600">Analysis Date:</span>
                <p className="font-semibold">
                  {new Date(analytics.metadata.analysisDate).toLocaleDateString()}
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
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setGraphsEventId(event._id)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                            View Graphs
                          </button>
                          <button
                            onClick={() => handleDownloadServerReport(event._id, event.title)}
                            disabled={isDownloading}
                            className={`text-gray-700 hover:underline text-sm ${isDownloading ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {isDownloading ? "Downloading..." : "Download PDF"}
                          </button>
                        </div>
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

        {/* Analytics + Generate */}
        <div className="mt-6 grid grid-cols-1 gap-6 items-start">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Event Analytics</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="hidden sm:inline">Quick view of event performance</span>
                <span aria-hidden>📊</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <label htmlFor="metric" className="text-sm text-gray-700">Metric</label>
                <select
                  id="metric"
                  value={incomeMetric}
                  onChange={(e) => setIncomeMetric(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="income">Income (₱)</option>
                  <option value="revenue">Revenue (₱)</option>
                  <option value="attendance">Attendance (count)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => setSortDesc((v) => !v)}
                  aria-label="Toggle sort order"
                >
                  {sortDesc ? "Sort: High → Low" : "Sort: Low → High"}
                </button>
              </div>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded">
                No past events match the current filters.
              </div>
            ) : (
              <Bar
                data={{
                  labels: filteredEvents
                    .slice()
                    .sort((a, b) => (sortDesc ? 1 : -1) * (getEventMetric(b) - getEventMetric(a)))
                    .map((e) => e.title),
                  datasets: [
                    {
                      label:
                        incomeMetric === "attendance"
                          ? "Attendance (count)"
                          : incomeMetric === "revenue"
                          ? "Revenue (₱)"
                          : "Income (₱)",
                      data: filteredEvents
                        .slice()
                        .sort((a, b) => (sortDesc ? 1 : -1) * (getEventMetric(b) - getEventMetric(a)))
                        .map((e) => getEventMetric(e)),
                      backgroundColor:
                        incomeMetric === "attendance"
                          ? "rgba(16, 185, 129, 0.7)"
                          : incomeMetric === "revenue"
                          ? "rgba(99, 102, 241, 0.7)"
                          : "rgba(37, 99, 235, 0.7)",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text:
                          incomeMetric === "attendance"
                            ? "Attendance (count)"
                            : incomeMetric === "revenue"
                            ? "Revenue (₱)"
                            : "Income (₱)",
                      },
                    },
                    x: { title: { display: true, text: "Event" } },
                  },
                }}
                height={160}
              />
            )}
            <div className="mt-3 text-xs text-gray-500">
              {incomeMetric === "income" && <span>Income is based only on paid registrations.</span>}
              {incomeMetric === "revenue" && <span>Revenue = Income − Cost. Costs come from each event's recorded cost.</span>}
              {incomeMetric === "attendance" && <span>Total number of registrations per event.</span>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-center">Generate Event Report</h2>
              <span className="text-sm text-gray-500" aria-hidden>📝</span>
            </div>
            <div className="mb-6">
              <label
                htmlFor="selectEvent"
                className="block text-sm font-medium text-gray-700 mb-1 text-center"
              >
                Choose Event
              </label>
              <div className="relative">
                <select
                  id="selectEvent"
                  className="appearance-none p-3 pr-10 border border-gray-300 rounded-lg w-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedEventId || ""}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  aria-label="Select event for report"
                >
                  <option value="">-- Select an Event --</option>
                  {filteredEvents.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" aria-hidden>▾</span>
              </div>
              {!selectedEventId && (
                <p className="mt-2 text-xs text-gray-500 text-center">Select a past event to generate a detailed report.</p>
              )}
            </div>
            {selectedEvent && (
              <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded border border-gray-200 px-3 py-2 bg-gray-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Date</div>
                  <div className="text-sm font-medium text-gray-800">{new Date(selectedEvent.date).toLocaleDateString()}</div>
                </div>
                <div className="rounded border border-gray-200 px-3 py-2 bg-gray-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Price</div>
                  <div className="text-sm font-medium text-gray-800">₱{selectedEvent.price || 0}</div>
                </div>
                <div className="rounded border border-gray-200 px-3 py-2 bg-gray-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Registrations</div>
                  <div className="text-sm font-medium text-gray-800">{selectedEvent.registrations?.length || 0}</div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
          <button
                className={`bg-blue-600 text-white px-6 py-2 rounded-lg shadow transition w-full sm:w-auto ${isLoadingFeedback ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            onClick={() => {
              if (!selectedEvent) return;
              setGeneratedReport({
                ...selectedEvent,
                eventSummary,
              });
              // Fetch feedback data when generating report
              fetchFeedbackData(selectedEvent._id);
            }}
            disabled={!selectedEventId || isLoadingFeedback}
          >
            {isLoadingFeedback ? (
                  <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Generating...
              </span>
            ) : (
              'Generate Complete Report'
            )}
          </button>
              {selectedEventId && (
                <button
                  type="button"
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => { setSelectedEventId(""); setEventSummary(""); setGeneratedReport(null); setFeedbackData(null); setFeedbackAnalytics(null); }}
                >
                  Clear
                </button>
              )}
            </div>

          {/* Loading indicator */}
          {isLoadingFeedback && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600">Loading feedback data...</span>
              </div>
            </div>
          )}
          </div>
        </div>

          {/* Feedback Data Status */}
          {feedbackData && (
          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">✓</span>
                <span className="text-green-700">
                  Feedback data loaded ({feedbackData.totalResponses} responses)
                </span>
              </div>
            </div>
          )}

          {/* Analytics Button */}
          {feedbackData && feedbackData.totalResponses > 0 && (
          <div className="mt-3">
              <button
                className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700 transition flex items-center gap-2"
                onClick={() => analyzeFeedbackData(selectedEventId, selectedEvent?.title)}
                disabled={isAnalyzingFeedback || getAnalyzableTextResponsesCount(feedbackData) === 0}
              >
                {isAnalyzingFeedback ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    Run AI Analytics
                  </>
                )}
              </button>
              <p className="text-sm text-gray-600 mt-1">
                Analyze text responses using AI to extract themes, sentiment, and insights
              </p>
              {getAnalyzableTextResponsesCount(feedbackData) === 0 && (
                <p className="text-sm text-yellow-700 mt-1 bg-yellow-50 p-2 rounded border border-yellow-200">
                  No sufficient text responses to analyze yet. Add at least one meaningful text response.
                </p>
              )}
            </div>
          )}

          {selectedEvent && generatedReport && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => setShowEventReport((v) => !v)}
                  className="border border-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-50 transition"
                >
                  {showEventReport ? 'Hide Event Report' : 'Show Event Report'}
                </button>
              </div>
              {showEventReport && (
              <div
                id="downloadableReport"
                className="bg-white p-8 rounded shadow-md text-black max-w-4xl mx-auto"
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
                                      title: { display: true, text: question.text || `Question ${index + 1}` },
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
                                      title: { display: true, text: question.text || `Question ${index + 1}` },
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
                                      title: { display: true, text: question.text || `Question ${index + 1}` },
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
                                   ({questionData.responses.length}) Responses
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

                {/* AI Analytics Summary */}
                {feedbackAnalytics && (
                  <div className="mt-6 p-4 bg-purple-50 rounded border" style={{ pageBreakBefore: 'always' }}>
                    <h3 className="text-lg font-semibold mb-3 text-purple-800">🤖 AI-Powered Analytics Summary</h3>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-purple-700 mb-2">Analysis Summary</h4>
                      <p className="text-sm text-gray-700">{feedbackAnalytics.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-semibold text-sm text-purple-700 mb-1">Sentiment</h5>
                        <p className="text-lg font-bold text-purple-600">
                          {feedbackAnalytics.sentiment.charAt(0).toUpperCase() + feedbackAnalytics.sentiment.slice(1)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Score: {(feedbackAnalytics.sentimentScore * 100).toFixed(0)}%
                        </p>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-semibold text-sm text-purple-700 mb-1">Response Quality</h5>
                        <p className="text-lg font-bold text-purple-600">
                          {feedbackAnalytics.responseQuality.charAt(0).toUpperCase() + feedbackAnalytics.responseQuality.slice(1)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {feedbackAnalytics.metadata?.textResponses || 0} responses analyzed
                        </p>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-semibold text-sm text-purple-700 mb-1">Analysis Date</h5>
                        <p className="text-lg font-bold text-purple-600">
                          {new Date(feedbackAnalytics.metadata?.analysisDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-purple-700 mb-2">Key Themes</h4>
                        <div className="flex flex-wrap gap-1">
                          {feedbackAnalytics.keyThemes.slice(0, 5).map((theme, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-purple-700 mb-2">Top Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {feedbackAnalytics.keywords.slice(0, 5).map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold text-purple-700 mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {feedbackAnalytics.insights.slice(0, 3).map((insight, index) => (
                          <li key={index} className="text-sm text-gray-700">• {insight}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold text-purple-700 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {feedbackAnalytics.recommendations.slice(0, 3).map((recommendation, index) => (
                          <li key={index} className="text-sm text-gray-700">• {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              )}

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

        {/* Feedback Report */}
        {selectedEvent && feedbackData && (
          <FeedbackReport feedbackData={feedbackData} />
        )}

        {/* AI Analytics Report */}
        {selectedEvent && (
          <FeedbackAnalytics 
            analytics={feedbackAnalytics}
            error={analyticsError}
            isLoading={isAnalyzingFeedback}
          />
        )}

        {/* Graphs Modal */}
        {graphsEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setGraphsEventId(null)}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{graphsEvent.title} - Graphs</h3>
                <button className="text-gray-500 hover:text-gray-800 text-xl" onClick={() => setGraphsEventId(null)}>×</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">Attendance</h4>
                  <div className="relative w-full" style={{ height: "300px" }}>
                    <Pie data={getAttendanceChartData(graphsEvent)} options={chartOptions} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">Attendees by Role</h4>
                  <div className="relative w-full" style={{ height: "300px" }}>
                    <Pie data={getRoleChartData(graphsEvent)} options={chartOptions} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setGraphsEventId(null)}
                >
                  Close
                </button>
                <button
                  className={`px-4 py-2 rounded bg-blue-600 text-white ${isDownloading ? "opacity-70" : "hover:bg-blue-700"}`}
                  onClick={() => handleDownloadServerReport(graphsEvent._id, graphsEvent.title)}
                  disabled={isDownloading}
                >
                  {isDownloading ? "Downloading..." : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        )}
        {isDownloading && (
          <div className="fixed top-4 right-4 z-[60] bg-white border border-gray-200 rounded-md shadow px-4 py-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Preparing PDF...</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default Report;