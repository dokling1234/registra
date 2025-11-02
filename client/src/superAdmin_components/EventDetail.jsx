// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";

// const EventDetail = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const [event, setEvent] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [showRescheduleForm, setShowRescheduleForm] = useState(false);
//   const [eventData, setEventData] = useState({
//     date: "",
//     time: "",
//   });

//   useEffect(() => {
//     const fetchEvent = async () => {
//       try {
//         const res = await axios.get(`/api/events/${id}`);
//         setEvent(res.data.event);
//       } catch (err) {
//         console.error(
//           "Failed to fetch event:",
//           err.response?.data || err.message
//         );
//       }
//     };

//     fetchEvent();
//   }, [id]);

//   const handleCancelEvent = async () => {
//     if (
//       !window.confirm(
//         "Are you sure you want to cancel this event? This action cannot be undone."
//       )
//     ) {
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const res = await axios.put(`/api/events/${id}/cancel`);
//       if (res.data.success) {
//         toast.success("Event cancelled successfully");
//         navigate("/superadmin/events");
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to cancel event");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleReschedule = () => {
//     setShowRescheduleForm(true);
//   };

//   const handleRescheduleSubmit = async (e) => {
//     e.preventDefault();
//     if (!eventData.date || !eventData.time) {
//       toast.error("Please fill in all fields");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const res = await axios.put(`/api/events/${id}`, eventData);

//       toast.success("Event rescheduled successfully");
//       setShowRescheduleForm(false);
//     } catch (err) {
//       toast.error(err);
//     }
//   };

//   const handleRescheduleChange = (e) => {
//     setEventData({
//       ...eventData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   if (!event) return <div className="p-8">Loading...</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex flex-col items-center py-12 px-4">
//       <div className="w-full max-w-2xl">
//         <button
//           className="mb-6 bg-blue-100 text-blue-700 px-5 py-2 rounded-lg hover:bg-blue-200 shadow"
//           onClick={() => navigate(-1)}
//         >
//           ← Back
//         </button>
//         <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
//           <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-6 mb-8 shadow w-full flex items-center justify-center">
//             <h1 className="text-4xl font-extrabold text-white tracking-wide text-center">
//               {event.title}
//             </h1>
//           </div>
//           <div className="w-full flex flex-col gap-4 mb-8">
//             <div className="flex items-center gap-2 text-lg text-gray-700">
//               <span className="font-semibold">Date:</span>
//               <span>{new Date(event.date).toLocaleDateString()}</span>
//               <span className="mx-2">|</span>
//               <span className="font-semibold">Time:</span>
//               <span>{event.time}</span>
//             </div>
//             <div className="flex items-center gap-2 text-lg text-gray-700">
//               <span className="font-semibold">Location:</span>
//               <span>{event.location}</span>
//             </div>
//             <div className="text-base text-gray-600">
//               <span className="font-semibold">About:</span> {event.about}
//             </div>
//             <div className="flex items-center gap-2 text-2xl font-bold text-blue-700 mt-2">
//               <span>₱{event.price}</span>
//             </div>
//           </div>

//           {showRescheduleForm ? (
//             <form
//               onSubmit={handleRescheduleSubmit}
//               className="w-full space-y-4 mb-6"
//             >
//               <div className="flex flex-col gap-2">
//                 <label className="font-semibold text-gray-700">New Date</label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={eventData.date}
//                   onChange={handleRescheduleChange}
//                   className="border border-gray-300 rounded-lg px-4 py-2"
//                   required
//                 />
//               </div>
//               <div className="flex flex-col gap-2">
//                 <label className="font-semibold text-gray-700">New Time</label>
//                 <input
//                   type="time"
//                   name="time"
//                   value={eventData.time}
//                   onChange={handleRescheduleChange}
//                   className="border border-gray-300 rounded-lg px-4 py-2"
//                   required
//                 />
//               </div>
//               {/* <div className="flex flex-col gap-2">
//                 <label className="font-semibold text-gray-700">Reason for Rescheduling</label>
//                 <textarea
//                   name="reason"
//                   value={eventData.reason}
//                   onChange={handleRescheduleChange}
//                   className="border border-gray-300 rounded-lg px-4 py-2 h-24"
//                   placeholder="Please provide a reason for rescheduling..."
//                   required
//                 />
//               </div> */}
//               <div className="flex gap-4 mt-4">
//                 <button
//                   type="submit"
//                   className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? "Processing..." : "Confirm Reschedule"}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowRescheduleForm(false);
//                     setIsLoading(false); // Reset loading state on cancel
//                   }}
//                   className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           ) : (
//             <div className="flex gap-4 mt-4">
//               <button
//                 className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-8 py-3 rounded-full font-semibold text-lg hover:from-yellow-600 hover:to-yellow-500 transition-all shadow"
//                 onClick={() => navigate(`/events/edit/${id}`)}
//               >
//                 Edit Event
//               </button>
//               <button
//                 className="bg-gradient-to-r from-green-500 to-green-400 text-white px-8 py-3 rounded-full font-semibold text-lg hover:from-green-600 hover:to-green-500 transition-all shadow"
//                 onClick={handleReschedule}
//               >
//                 Reschedule
//               </button>
//               <button
//                 className="bg-gradient-to-r from-red-500 to-red-400 text-white px-8 py-3 rounded-full font-semibold text-lg hover:from-red-600 hover:to-red-500 transition-all shadow"
//                 onClick={handleCancelEvent}
//                 disabled={isLoading}
//               >
//                 {isLoading ? "Cancelling..." : "Cancel Event"}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EventDetail;
