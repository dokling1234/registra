// controllers/eventController.js
const eventModel = require("../models/eventModel.js");
const userModel = require("../models/userModel.js");
const { encryptData, decryptData } = require("../config/cryptoUtil.js");
const QRCode = require("qrcode");
const admin = require("../config/firebaseAdmin.js");
const axios = require("axios");
const e = require("express");
const mongoose = require("mongoose");

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
      webinarLink, // ✅ Accept webinar link
    } = req.body;

    // ✅ Validate link if it's a webinar
    if (eventType === "Webinar" && !webinarLink) {
      return res.status(400).json({
        success: false,
        message: "Webinar link is required for Webinar events.",
      });
    }

    const event = new eventModel({
      title,
      date,
      location,
      coordinates,
      time: formatTimeToAMPM(time),
      about,
      price,
      cost,
      hostName,
      eventType,
      eventTarget,
      image,
      webinarLink: eventType === "Webinar" ? webinarLink : undefined, // ✅ Store only if webinar
    });

    if (req.body.organizers) {
      event.organizers = req.body.organizers;
    }

    await event.save();

    // ✅ Send push notification (unchanged, but we can include link later if you want)
    try {
      const notificationData = {
        notification: {
          title: event.title,
          body: `${event.location} • ${event.date} • ${event.time}`,
        },
        data: {
          eventId: String(event._id),
          title: String(event.title || ""),
          location: String(event.location || ""),
          date: event.date ? new Date(event.date).toISOString() : "",
          time: String(event.time || ""),
          image: String(event.image || ""),
          about: String(event.about || ""),
          hostName: String(event.hostName || ""),
          price: String(event.price ?? ""),
          webinarLink: String(event.webinarLink || ""), // ✅ Added if needed
        },
        topic: "allUsers",
      };

      if (event.image) {
        notificationData.notification.image = event.image;
      }

      await admin.messaging().send(notificationData);
    } catch (notifyErr) {
      console.error("Error sending notification:", notifyErr);
    }

    // Log activity
    try {
      const { logActivity } = require("../services/activityLogService.js");
      await logActivity(req, {
        action: "create_event",
        targetType: "event",
        targetId: event._id,
        metadata: { title },
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};
// ========== GET EVENTS WITH FILTERS (Mobile) ==========
const getEvents = async (req, res) => {
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
      date,
    } = req.query;
    const match = {};

    if (type && type !== "All") match.eventType = type;
    if (location && location !== "All") match.location = location;

    match.status = { $ne: "cancelled" };

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

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      const endOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() + 1
      );

      match.date = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }
    pipeline.push({ $match: match });

    const events = await eventModel.aggregate(pipeline);
    res.status(200).json(events);
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

    await event.save();

    return res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateEvent = async (req, res) => {
  try {
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
      )}&format=json`,
      {
        headers: {
          "User-Agent":
            "RegistraApp/1.0 (https://registra-b7181b9e50a0.herokuapp.com; carrel.golosinda@gmail.com)",
        },
        timeout: 10000, // 10 second timeout
      }
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

    // Handle specific error cases
    if (err.response?.status === 403) {
      return res.status(429).json({
        message:
          "Geocoding service temporarily unavailable. Please try again later.",
      });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(408).json({
        message: "Geocoding request timed out. Please try again.",
      });
    }

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
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          "User-Agent":
            "RegistraApp/1.0 (https://registra-b7181b9e50a0.herokuapp.com; carrel.golosinda@gmail.com)",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const data = response.data;

    if (data && data.display_name) {
      return res.json({ display_name: data.display_name });
    } else {
      return res.status(404).json({ message: "Address not found" });
    }
  } catch (err) {
    console.error("Reverse geocoding error:", err.message);

    // Handle specific error cases
    if (err.response?.status === 403) {
      return res.status(429).json({
        message:
          "Geocoding service temporarily unavailable. Please try again later.",
      });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(408).json({
        message: "Geocoding request timed out. Please try again.",
      });
    }

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
    const event = await eventModel.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    const registrant = event.registrations.find(
      (reg) => reg._id.toString() === registrantId
    );
    if (!registrant) {
      return res
        .status(404)
        .json({ success: false, message: "Registrant not found" });
    }

    if (paymentStatus === "paid") {
      if (event.eventType === "Webinar" && event.webinarLink) {
        // Generate QR Code for the webinar link
        registrant.ticketQR = await QRCode.toDataURL(event.webinarLink);
      } else {
        // Default behavior: Encrypted QR for physical events
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

        registrant.ticketQR = await QRCode.toDataURL(combinedPayload);
      }
    } else if (paymentStatus === "rejected") {
      registrant.ticketQR = "";
    }

    registrant.paymentStatus = paymentStatus;
    await event.save();

    res.json({ success: true, message: "Payment status updated", registrant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRegisteredEvents = async (req, res) => {
  const { userId } = req.user;

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
    const registration = event.registrations.find(
      (reg) => reg.userId.toString() === userId
    );

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: "You are not registered for this event.",
      });
    }

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
  const {
    eventId,
    userId,
    email,
    paymentStatus,
    ticketQR,
    fullName,
    receipt,
    registrationId,
  } = req.body;

  try {
    let event = null;
    if (eventId) {
      event = await eventModel.findById(eventId);
    }
    // Fallback: locate event by existing registration when eventId missing
    if (!event && registrationId) {
      event = await eventModel.findOne({ "registrations._id": registrationId });
    }

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Block registering for two different events on the same calendar day
    try {
      const eventDate = new Date(event.date);
      const startOfDay = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );
      const endOfDay = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate() + 1
      );
      const sameDayOtherEvent = await eventModel.findOne({
        _id: { $ne: event._id },
        date: { $gte: startOfDay, $lt: endOfDay },
        "registrations.userId": new mongoose.Types.ObjectId(userId),
      });
      if (sameDayOtherEvent) {
        return res.status(400).json({
          message:
            "You are already registered for another event on the same date.",
        });
      }
    } catch (_) {}

    // If resubmitting for an existing registration
    if (registrationId) {
      const reg = event.registrations.id(registrationId);
      if (!reg) {
        return res.status(404).json({ message: "Registration not found" });
      }
      // Update receipt and reset status to pending; clear QR until re-approved
      reg.receipt = receipt || reg.receipt;
      reg.paymentStatus = "pending";
      reg.ticketQR = "";
      await event.save();
      return res.status(200).json({ message: "Receipt resubmitted!" });
    }

    // Prevent duplicates: if user already registered, update receipt instead
    const existing = event.registrations.find(
      (r) => r.userId?.toString() === String(userId)
    );
    if (existing) {
      existing.receipt = receipt || existing.receipt;
      existing.paymentStatus = "pending";
      existing.ticketQR = "";
      await event.save();
      return res
        .status(200)
        .json({ message: "Existing registration updated with new receipt." });
    }

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
  const { userId } = req.query;
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

    return res.status(200).json({
      ticketQR: registration.ticketQR,
      attended: !!registration.attended,
      paymentStatus: registration.paymentStatus || undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
// controllers/eventController.js

const resendTicket = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "User ID is required" });

  try {
    const event = await eventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registration = event.registrations.find(
      (r) => r.userId.toString() === userId.toString()
    );

    if (!registration)
      return res.status(404).json({ message: "User not registered" });

    // Generate QR if missing
    if (!registration.ticketQR) {
      registration.ticketQR = await QRCode.toDataURL(
        event.webinarLink || JSON.stringify({ id: registration._id })
      );
      await event.save();
    }

    res.status(200).json({ ticketUrl: registration.ticketQR });
  } catch (err) {
    console.error("Resend ticket error:", err);
    res.status(500).json({ message: err.message });
  }
};

const getRegisteredPastEvents = async (req, res) => {
  const userId = req.query.userId;
  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const now = new Date();

    // Return only past events where this user's registration is paid and attended
    const events = await eventModel
      .find({
        date: { $lt: now },
        registrations: {
          $elemMatch: {
            userId: userId,
            paymentStatus: "paid",
            attended: true,
          },
        },
      })
      .lean(); // Add .lean() for better performance

    // Add hasCertificate field to each event
    const eventsWithCertificate = events.map((event) => ({
      ...event,
      hasCertificate: false, // or determine this based on your logic
    }));

    res.status(200).json(eventsWithCertificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getEventDetailsById = async (req, res) => {
  try {
    const event = await eventModel.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.status(200).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const checkSameDayRegistration = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await eventModel.findById(eventId);

    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    // Print original event date

    // Calculate start and end of day
    const startOfDay = new Date(event.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(event.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Print what is being used in the query

    const sameDayEvents = await eventModel.find({
      _id: { $ne: eventId },
      "registrations.userId": userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (sameDayEvents.length > 0) {
      return res.json({
        success: false,
        message: "Already registered for another event on the same date",
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
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
  resendTicket,
  checkSameDayRegistration,
};
