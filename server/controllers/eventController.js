// controllers/eventController.js
const eventModel = require("../models/eventModel.js");
const userModel = require("../models/userModel.js");
const { encryptData, decryptData } = require("../config/cryptoUtil.js");
const QRCode = require("qrcode");
const axios = require("axios");
const e = require("express");

const formatTimeToAMPM = (time24) => {
  if (!time24 || !time24.includes(":")) return time24;
  const [hour, minute] = time24.split(":");
  const h = parseInt(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
};
const createEvent = async (req, res) => {
  try {
    const {
      title,
      date,
      location,
      coordinates,
      time,
      price,
      cost,
      hostName,
      eventType,
      about,
      eventTarget,
      image,
    } = req.body;

    /*   const creator = req.user._id;
     */ console.log("test");

    const event = new eventModel({
      title,
      date,
      location,
      coordinates,
      time: formatTimeToAMPM(time), // Convert to AM/PM format
      about,
      price,
      cost,
      hostName,
      eventType,
      eventTarget,
      image,
    });

    console.log("test2");

    if (req.body.organizers) {
      event.organizers = req.body.organizers;
    }

    await event.save();

    res
      .status(201)
      .json({ success: true, message: "Event created successfully", event });
  } catch (err) {
    console.error("Error saving event:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: err.message,
    });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await eventModel.find();

    const currentDate = new Date();

    // update if pastevent
    const updatedEvents = await Promise.all(
      events.map(async (event) => {
        const eventDate = new Date(event.date);

        if (eventDate < currentDate && !event.isPastEvent) {
          event.isPastEvent = true;
          await event.save();
        }

        return event;
      })
    );

    // Filter for display
    const activeEvents = updatedEvents.filter((event) => !event.isPastEvent);

    res.status(200).json({
      success: true,
      events: events,
      count: events.length,
    });
    console.log("Fetched all events successfully" + events.length);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};
// ========== GET EVENTS WITH FILTERS (Mobile) ==========
const getEvents = async (req, res) => {
  console.log("getevents");
  try {
    const {
      type,
      location,
      month,
      longitude,
      latitude,
      maxDistance,
      userType,
      membership,
    } = req.query;
    const match = {};

    if (type && type !== "All") match.eventType = type;
    if (location && location !== "All") match.location = location;

    // Role-based filtering
    if (userType === "student" || membership === "non-member") {
      match.eventTarget = { $nin: ["Admin"] };
    } else if (userType === "professional") {
      match.eventTarget = { $in: ["professional", "Both"] };
    } else if (userType === "admin") {
      match.eventTarget = { $in: ["Admin", "Both"] };
    }

    const pipeline = [];

    if (longitude && latitude) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: maxDistance ? parseInt(maxDistance) : 10000,
        },
      });
    }

    if (month && month !== "All") {
      pipeline.push({
        $addFields: {
          monthName: { $dateToString: { format: "%B", date: "$date" } },
        },
      });
      match.monthName = month;
    }

    pipeline.push({ $match: match });

    const events = await eventModel.aggregate(pipeline);
    res.status(200).json(events);
    console.log(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await eventModel.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerForEvent = async (req, res) => {
  console.log("registerforevent");
  const { eventId } = req.params;
  const {
    fullName,
    userType,
    email,
    paymentStatus,
    ticketQR,
    receipt,
    membership,
  } = req.body;
  console.log(fullName);
  const { userId } = req.user;

  try {
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const alreadyRegistered = event.registrations.some(
      (r) => r.userId.toString() === userId || r.fullName === fullName
    );

    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ success: false, message: "Already registered" });
    }

    // Calculate price based on membership
    let finalPrice = event.price;
    if (membership && membership.toLowerCase() === "non-member") {
      finalPrice = Math.round(event.price * 1.05);
    }

    const ticketQR = "";
    event.registrations.push({
      userId,
      fullName,
      userType,
      paymentStatus: "pending",
      ticketQR,
      attended: false,
      price: finalPrice,
      membership: membership || "Member",
      receipt,
    });
    console.log("Registrations before save:", event.registrations);

    await event.save();

    return res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateEvent = async (req, res) => {
  try {
    console.log("Updating event with ID:", req.params.id);
    console.log("Update data:", req.body);
    const updated = await eventModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updated) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event updated", event: updated });
  } catch (err) {
    console.error("Update error:", err);

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const geocodeAddress = async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ message: "Address is required" });

  try {
    const geoRes = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json`
    );

    if (geoRes.data && geoRes.data.length > 0) {
      const location = geoRes.data[0];
      return res.json({
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        display_name: location.display_name,
      });
    } else {
      return res.status(404).json({ message: "Location not found" });
    }
  } catch (err) {
    console.error("Geocoding error:", err.message);
    res.status(500).json({ message: "Geocoding failed" });
  }
};

const reverseGeocode = async (req, res) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required" });
  }

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );

    const data = response.data;

    if (data && data.display_name) {
      return res.json({ display_name: data.display_name });
    } else {
      return res.status(404).json({ message: "Address not found" });
    }
  } catch (err) {
    console.error("Reverse geocoding error:", err.message);
    res.status(500).json({ message: "Reverse geocoding failed" });
  }
};

const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("registrations");
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const confirmPayment = async (req, res) => {
  const { id } = req.params;
  const { registrationId } = req.body;

  try {
    const event = await Event.findById(id);
    const reg = event.registrations.id(registrationId);
    if (!reg)
      return res.status(404).json({ message: "Registration not found" });

    reg.paymentStatus = "paid";
    await event.save();

    res.json({ message: "Payment confirmed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { registrantId, paymentStatus, fullName, userType } = req.body;

  try {
    console.log("_____________________" + id);
    const event = await eventModel.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    console.log(registrantId + "_____________________");
    const registrant = event.registrations.find(
      (reg) => reg._id.toString() === registrantId
    );
    if (!registrant) {
      return res
        .status(404)
        .json({ success: false, message: "Registrant not found" });
    }
    console.log(registrant);
    console.log("BODY:", req.body);

    if (paymentStatus === "paid") {
      console.log("Generating encrypted QR Code...");

      const qrData = {
        id: registrant._id.toString(),
        fullName: registrant.fullName,
        userType: registrant.userType,
      };

      const encryptedPayload = encryptData(qrData);

      const combinedPayload = JSON.stringify({
        data: encryptedPayload.data,
        iv: encryptedPayload.iv,
      });

      // Generate QR Code
      const qrCode = await QRCode.toDataURL(combinedPayload);
      registrant.ticketQR = qrCode;
    }

    registrant.paymentStatus = paymentStatus;
    await event.save();

    res.json({ success: true, message: "Payment status updated", registrant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message } + "eto ba?");
  }
};

const getRegisteredEvents = async (req, res) => {
  const { userId } = req.user;
  console.log("==============================");

  try {
    const registeredEvents = await eventModel.find({
      "registrations.userId": userId,
    });

    const currentDate = new Date();

    const annotatedEvents = registeredEvents.map((event) => {
      const eventObj = event.toObject();
      eventObj.isPastEvent = new Date(event.date) < currentDate;
      return eventObj;
    });

    res.status(200).json({ success: true, events: annotatedEvents });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch registered events." });
  }
};

const getRegisteredEventDetail = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { userId } = req.user;

    const event = await eventModel.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    console.log(userId);
    const registration = event.registrations.find(
      (reg) => reg.userId.toString() === userId
    );

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: "You are not registered for this event.",
      });
    }
    console.log(
      "________________________________________",
      registration.ticketQR
    );
    const eventWithTicket = {
      ...event._doc,
      ticketUrl: registration.ticketQR, // base64 string
    };

    res.status(200).json({ success: true, event: eventWithTicket });
  } catch (err) {
    console.error("Error fetching registered event:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getEventByTitle = async (req, res) => {
  try {
    const { title } = req.body;
    console.log("Searching for events with title:", title);

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title query parameter is required" });
    }

    const events = await eventModel.find({
      title: { $regex: title, $options: "i" }, // Case-insensitive search
    });

    // Ensure the response is structured as expected
    res.status(200).json({ success: true, events });
  } catch (err) {
    console.error("Error searching events:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const mobileRegisterForEvent = async (req, res) => {
  const { eventId, userId, email, paymentStatus, ticketQR, fullName, receipt } =
    req.body;

  try {
    const event = await eventModel.findById(eventIxd);
    if (!event) return res.status(404).json({ message: "Event not found" });

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

    event.registrations.push(registrations);
    await event.save();

    res.status(200).json({ message: "Registration successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const mobileGetRegisteredEvents = async (req, res) => {
  console.log("1");
  const { userId } = req.query;
  console.log("User ID:", userId);
  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const events = await eventModel.find({
      "registrations.userId": userId,
    });

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTicketQR = async (req, res) => {
  const { registrationsId } = req.query;

  try {
    if (!registrationsId) {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    const event = await eventModel.findOne({
      "registrations._id": registrationsId,
    });

    if (!event) {
      return res.status(404).json({ message: "No event found for user." });
    }

    const registration = event.registrations.find(
      (r) => r._id.toString() === registrationsId
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found." });
    }

    return res.status(200).json({ ticketQR: registration.ticketQR });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getRegisteredPastEvents = async (req, res) => {
  const userId = req.query.userId;
  console.log(userId);
  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const now = new Date();

    const events = await eventModel.find({
      "registrations.userId": userId,
      date: { $lt: now },
    }).lean(); // Add .lean() for better performance

    // Add hasCertificate field to each event
    const eventsWithCertificate = events.map(event => ({
      ...event,
      hasCertificate: false // or determine this based on your logic
    }));

    res.status(200).json(eventsWithCertificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  registerForEvent,
  updateEvent,
  geocodeAddress,
  reverseGeocode,
  getEventDetails,
  confirmPayment,
  updatePaymentStatus,
  getRegisteredEvents,
  getRegisteredEventDetail,
  getEventByTitle,
  getEvents,
  mobileRegisterForEvent,
  mobileGetRegisteredEvents,
  getTicketQR,
  getRegisteredPastEvents,
};
