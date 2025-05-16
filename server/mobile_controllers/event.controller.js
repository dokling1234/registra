import eventModel from '../mobile_models/event.model.js';
import mongoose from 'mongoose';

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const event = new eventModel(req.body);
    await event.save();
    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get events with optional filters (type, location, month, coordinates)
export const getEvents = async (req, res) => {
  try {
    const { type, location, month, longitude, latitude, maxDistance, userType, membership, about, price } = req.query;
    const match = {};

    if (type) match.eventType = type;
    if (location) match.location = location;
    // Exclude admin events for students and non-members
    if (userType === "Student" || membership === "Non-Member") {
      match.eventTarget = { $nin: ["Admin"] };
    } else if (userType === "Professional") {
      match.eventTarget = { $in: ["Professional", "Both"] };
    } else if (userType === "Admin") {
      match.eventTarget = { $in: ["Admin", "Both"] };
    }

    const pipeline = [];

    if (longitude && latitude) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: 'distance',
          spherical: true,
          maxDistance: maxDistance ? parseInt(maxDistance) : 10000,
        },
      });
    }

    if (month && month !== 'All') {
      pipeline.push({
        $addFields: {
          monthName: {
            $dateToString: { format: '%B', date: '$date' },
          },
        },
      });

      match.monthName = month;
    }

    pipeline.push({ $match: match });

    const events = await eventModel.aggregate(pipeline);
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register a user for an event
export const registerForEvent = async (req, res) => {
  const { eventId, userId, email, paymentStatus, ticketQR, fullName, receipt } = req.body;

  try {
    const event = await eventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registrations = {
      fullName,
      eventId,
      userId,
      registeredAt: new Date(),
      paymentStatus,
      ticketQR,
      attended: false,
      receipt,
    };

    console.log('🚀 Register endpoint hit');
    console.log('Body:', req.body);

    event.registrations.push(registrations);
    await event.save();

    res.status(200).json({ message: 'Registration successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get registered events for a user
export const getRegisteredEvents = async (req, res) => {
  const { userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const events = await eventModel.find({
      'registrations.userId': userId,
    });

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get ticket QR for a specific registration
export const getTicketQR = async (req, res) => {
  const { registrationsId } = req.query;

  try {
    if (!registrationsId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const event = await eventModel.findOne({
      'registrations._id': registrationsId,
    });

    if (!event) {
      return res.status(404).json({ message: 'No event found for user.' });
    }

    const registration = event.registrations.find(
      (r) => r._id.toString() === registrationsId
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    return res.status(200).json({ ticketQR: registration.ticketQR });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get registered past events for a user
export const getRegisteredPastEvents = async (req, res) => {
  const { userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const now = new Date();

    const events = await eventModel.find({
      'registrations.userId': userId,
      date: { $lt: now },
    });

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
