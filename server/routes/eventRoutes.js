const express = require("express");
const {
  createEvent,
  getAllEvents,
  getEventById,
  registerForEvent,
  updateEvent,
  confirmPayment,
  geocodeAddress,
  reverseGeocode,
  updatePaymentStatus,
  getRegisteredEvents,
  getRegisteredEventDetail,
  getEventByTitle,
  getEvents,
  mobileGetRegisteredEvents,
  mobileRegisterForEvent,
  getTicketQR,
  getRegisteredPastEvents,
  resendTicket,
  checkSameDayRegistration,
} = require("../controllers/eventController.js");
const userAuth = require("../middleware/userAuth.js");

const eventRouter = express.Router();

eventRouter.post("/create", createEvent);
eventRouter.get("/registered", userAuth, getRegisteredEvents);
eventRouter.get("/", getAllEvents);
eventRouter.get("/:id", getEventById);
eventRouter.post("/register/:id", userAuth, registerForEvent); // eventId
eventRouter.put("/:id", updateEvent);
eventRouter.put("/events/:id/confirm-payment", confirmPayment);
eventRouter.post("/location/geocode", geocodeAddress);
eventRouter.post("/location/reverse-geocode", reverseGeocode);
eventRouter.put("/updatePaymentStatus/:id", updatePaymentStatus);
eventRouter.get("/registered/:id", userAuth, getRegisteredEventDetail);
eventRouter.post("/search", getEventByTitle);
eventRouter.post("/resend-ticket/:eventId", userAuth, resendTicket);
eventRouter.get("/:eventId/check-sameday", userAuth, checkSameDayRegistration);

const mobileEventRouter = express.Router();

mobileEventRouter.get("/events", getEvents);
mobileEventRouter.post("/events/event_register", mobileRegisterForEvent);
mobileEventRouter.get("/events/events_registered", mobileGetRegisteredEvents);
mobileEventRouter.post("/events/events_registered/ticket", getTicketQR);
mobileEventRouter.get("/events/registered_past", getRegisteredPastEvents);

module.exports = { eventRouter, mobileEventRouter };
