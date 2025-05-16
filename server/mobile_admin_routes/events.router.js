import express from 'express';
const router = express.Router();

import { userAuth } from '../mobile_admin_middleware/userAuth.js';
import { registerForEvent, getEvents, createEvent, QRchecker } from '../mobile_admin_controller/event.controller.js';

// POST /events
router.post('/events', createEvent);
router.get('/events', getEvents);
router.post('/event_register', registerForEvent);
router.put('/attendance/update', QRchecker);

export default router;
