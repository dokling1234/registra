import express from "express";
import {
  registerForEvent,
  getEvents,
  createEvent,
  getRegisteredEvents,
  getTicketQR,
  getRegisteredPastEvents,
} from "../mobile_controllers/event.controller.js";

const mobileEventRouter = express.Router();

// POST /events
mobileEventRouter.post("/events", createEvent);
mobileEventRouter.get("/events", getEvents);
mobileEventRouter.post("/events/event_register", registerForEvent);
mobileEventRouter.get("/events/registered", getRegisteredEvents);
mobileEventRouter.post("/events/registered/ticket", getTicketQR);
mobileEventRouter.get("/registered-past", getRegisteredPastEvents);

export default mobileEventRouter;
