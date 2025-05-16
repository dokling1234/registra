import express from 'express';
import { createEvent, getAllEvents, getEventById, registerForEvent, updateEvent, confirmPayment, geocodeAddress, reverseGeocode, updatePaymentStatus, getRegisteredEvents, getRegisteredEventDetail, getEventByTitle } from '../controllers/eventController.js';
import { userAuth, userTypeAuth } from '../middleware/userAuth.js';

const eventRouter = express.Router();

eventRouter.post('/create', createEvent);
eventRouter.get('/registered', userAuth, getRegisteredEvents); 
eventRouter.get('/', getAllEvents);
eventRouter.get('/:id', getEventById);
eventRouter.post("/register/:eventId", userAuth, registerForEvent);
eventRouter.put('/:id', updateEvent);
eventRouter.put("/events/:id/confirm-payment", confirmPayment);
eventRouter.post('/geocode', geocodeAddress);
eventRouter.post('/reverse-geocode', reverseGeocode);
eventRouter.put('/updatePaymentStatus/:id', updatePaymentStatus);
eventRouter.get("/registered/:id", userAuth, getRegisteredEventDetail);
eventRouter.post('/search', getEventByTitle);

export default eventRouter;