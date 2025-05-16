// controllers/eventController.js
import eventModel from "../models/eventModel.js";
import userModel from "../models/userModel.js";
import { encryptData, decryptData } from "../config/cryptoUtil.js";
import QRCode from "qrcode";
import axios from "axios";

export const createEvent = async (req, res) => {
  try {
    const formatTimeToAMPM = (time24) => {
      if (!time24 || !time24.includes(":")) return time24;
      const [hour, minute] = time24.split(":");
      const h = parseInt(hour);
      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:${minute} ${suffix}`;
    };
    const {
      title,
      date,
      location,
      coordinates,
      time,
      price,
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
      hostName,
      eventType,
      eventTarget,
      image,
    });

    console.log("test2");

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

export const getAllEvents = async (req, res) => {
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
      events: activeEvents,
      count: activeEvents.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

export const getEventById = async (req, res) => {
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

export const registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const { fullName, userType } = req.body;
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

    const ticketQR = "";
    event.registrations.push({
      userId,
      fullName,
      userType,
      paymentStatus: "pending",
      ticketQR,
      attended: false,
    });
    console.log("Registrations before save:", event.registrations);

    await event.save();

    return res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateEvent = async (req, res) => {
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

export const geocodeAddress = async (req, res) => {
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

export const reverseGeocode = async (req, res) => {
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

export const getEventDetails = async (req, res) => {
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

export const confirmPayment = async (req, res) => {
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

export const updatePaymentStatus = async (req, res) => {
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

export const getRegisteredEvents = async (req, res) => {
  const { userId } = req.user;
  try {
    const registeredEvents = await eventModel.find({
      "registrations.userId": userId,
    });

    console.log(registeredEvents, "__________asdsada________");
    res.status(200).json({ success: true, events: registeredEvents });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch registered events." });
  }
  const currentDate = new Date();

  const annotatedEvents = registeredEvents.map((event) => {
    const eventObj = event.toObject();
    eventObj.isPastEvent = new Date(event.date) < currentDate;
    return eventObj;
  });

  res.status(200).json({ success: true, events: annotatedEvents });
};
export const getRegisteredEventDetail = async (req, res) => {
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
    console.log("API Response:", res.data); // Log the entire response

    res.status(200).json({ success: true, event: eventWithTicket });
  } catch (err) {
    console.error("Error fetching registered event:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getEventByTitle = async (req, res) => {
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
    console.log("Found events:", events);
    res.status(200).json({ success: true, events });
  } catch (err) {
    console.error("Error searching events:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      });
  }
};
