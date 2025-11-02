// import React from "react";
// import { Link } from "react-router-dom";

// const EventCard = ({ event }) => {
//   const eventDate = new Date(event.date).toLocaleDateString();
//   return (
//     <Link to={`/events/${event._id}`}>
//       <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm">
//         {/* <img
//         src={event.imageUrl || "/placeholder.jpg"}  
//         alt={event.title}
//         className="w-full h-48 object-cover"
//       /> */}
//         <div className="p-4">
//           <div className="text-sm text-gray-500 mb-1">
//             {eventDate} • {event.time}
//           </div>
//           <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
//           <p className="text-sm text-gray-600">{event.location}</p>
//           <div className="mt-3 flex justify-between items-center">
//             <span className="text-primary font-bold">${event.price}</span>
//             <span className="text-xs text-gray-500">{event.eventType}</span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// };

// export default EventCard;
