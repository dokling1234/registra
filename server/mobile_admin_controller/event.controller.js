import Event from '../model/event.model.js';
import mongoose from 'mongoose';

export const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { type, location, month, longitude, latitude, maxDistance } = req.query;
    const match = {};

    if (type) match.eventType = type;
    if (location) match.location = location;

    const pipeline = [];

    if (longitude && latitude) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: maxDistance ? parseInt(maxDistance) : 10000 // Default 10km
        }
      });
    }

    if (month && month !== 'All') {
      pipeline.push({
        $addFields: {
          monthName: {
            $dateToString: { format: "%B", date: "$date" }
          }
        }
      });

      match.monthName = month;
    }

    pipeline.push({ $match: match });

    const events = await Event.aggregate(pipeline);
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const registerForEvent = async (req, res) => {
  const { eventId, userId, email, paymentStatus, ticketQR } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registrations = {
      eventId,
      userId,
      registeredAt: new Date(),
      paymentStatus,
      ticketQR,
    };

    console.log("🚀 Register endpoint hit");
    console.log("Body:", req.body);

    event.registrations.push(registrations);
    await event.save();

    res.status(200).json({ message: "Registration successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const QRchecker = async (req, res) => {
  const { userId } = req.body;

  try {
    const objectId = new mongoose.Types.ObjectId(userId);

    const event = await Event.findOne({ "registrations._id": objectId });
    if (!event) {
      return res.status(404).json({ message: 'Registration not found in any event' });
    }

    const registration = event.registrations.find(reg => reg._id.toString() === objectId.toString());
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.attended) {
      return res.status(400).json({ message: 'QR code has already been used' });
    }

    registration.attended = true;
    await event.save();

    return res.json({ message: 'Attendance updated successfully' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
