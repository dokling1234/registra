import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Sidebar from "../admin_components/Sidebar";

const Receipt = () => {
  const navigate = useNavigate();
  const { userData, isAdmin } = useContext(AppContent);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceiptPopup, setShowReceiptPopup] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  useEffect(() => {
        if (!isAdmin) {
          // Not an admin, redirect to home or another page
          navigate("/admin");
        }
      }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events");
        setEvents(res.data.events);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching events:", err);
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handlePaymentStatus = async (eventId, registrantId, status) => {
    try {
      await axios.put(`/api/events/updatePaymentStatus/${eventId}`, {
        registrantId,
        paymentStatus: status,
      });
      
      // Update the local state
      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (event._id === eventId) {
            return {
              ...event,
              registrations: event.registrations.map(reg =>
                reg._id === registrantId ? { ...reg, paymentStatus: status } : reg
              )
            };
          }
          return event;
        })
      );

      if (selectedEvent?._id === eventId) {
        setSelectedEvent(prev => ({
          ...prev,
          registrations: prev.registrations.map(reg =>
            reg._id === registrantId ? { ...reg, paymentStatus: status } : reg
          )
        }));
      }

      setShowReceiptPopup(false);
    } catch (err) {
      console.error("Failed to update payment status:", err.response?.data || err.message);
    }
  };

  if (!userData) {
    return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  }

  if (userData.userType !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Receipt Management</h1>
          {userData && (
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Events List */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Events</h2>
            {isLoading ? (
              <p className="text-gray-500">Loading events...</p>
            ) : (
              <div className="space-y-2">
                {events.map(event => (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedEvent?._id === event._id
                        ? 'bg-blue-100 border-blue-500'
                        : 'hover:bg-gray-100 border-gray-200'
                    } border`}
                  >
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Registrations List */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Registrations</h2>
            {selectedEvent ? (
              selectedEvent.registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                    
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEvent.registrations.map((registrant) => (
                        <tr key={registrant._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {registrant.fullName || registrant.fullName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                              registrant.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {registrant.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center gap-2">
                              {registrant.receipt ? (
                                <button
                                  onClick={() => {
                                    setCurrentReceipt({ 
                                      receipt: registrant.receipt,
                                      eventId: selectedEvent._id,
                                      registrantId: registrant._id
                                    });
                                    setShowReceiptPopup(true);
                                  }}
                                  className="text-blue-500 hover:underline text-sm focus:outline-none"
                                >
                                  View Receipt
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm italic">
                                  No receipt
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No registrations for this event.</p>
              )
            ) : (
              <p className="text-gray-500">Select an event to view registrations.</p>
            )}
          </div>
        </div>
      </main>

      {/* Receipt Popup */}
      {showReceiptPopup && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Receipt Details</h3>
              <button
                onClick={() => setShowReceiptPopup(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="mb-4 flex justify-center">
              <img src={currentReceipt.receipt} alt="Receipt" className="max-w-full h-auto rounded max-h-96" />
            </div>
            <div className="flex justify-center gap-4 w-full">
            <button
                onClick={() => handlePaymentStatus(currentReceipt.eventId, currentReceipt.registrantId, "paid")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex-1 mx-2"
              >
                Confirm
              </button>
              <button
                onClick={() => handlePaymentStatus(currentReceipt.eventId, currentReceipt.registrantId, "rejected")}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex-1 mx-2"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt; 