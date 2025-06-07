const Certificate = require("../models/certificateModel.js");
const Event = require("../models/eventModel.js");
const CertificateTemplate = require("../models/certificateTemplateModel.js");

const saveCertificate = async (req, res) => {
  console.log("savecert");
  try {
    const { eventId, certificateUrl } = req.body;
    const userId = req.user.userId; // From auth middleware

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ eventId, userId });
    if (existingCertificate) {
      // Update existing certificate
      existingCertificate.certificateUrl = certificateUrl;
      existingCertificate.issuedAt = new Date();
      await existingCertificate.save();
      return res.json({
        success: true,
        message: "Certificate updated successfully",
        certificate: existingCertificate,
      });
    }

    // Create new certificate
    const newCertificate = new Certificate({
      eventId,
      userId,
      certificateUrl,
    });

    await newCertificate.save();
    res.status(201).json({
      success: true,
      message: "Certificate saved successfully",
      certificate: newCertificate,
    });
  } catch (err) {
    console.error("Error saving certificate:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getCertificate = async (req, res) => {
  console.log("getcertificate");
  try {
    const { eventId } = req.params;
    const userId = req.user.userId; // From auth middleware
    console.log("getCertificate", eventId, userId);
    const certificate = await Certificate.findOne({ eventId, userId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      certificate,
    });
    console.log("Certificate fetched successfully");
  } catch (err) {
    console.log("Error fetching certificate:");

    console.error("Error fetching certificate:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const saveTemplate = async (req, res) => {
  console.log("savetemplate_____");
  try {
    const { eventId, organizers, templateId } = req.body;

    if (!eventId || !organizers) {
      return res.status(400).json({
        success: false,
        message: "eventId and organizers are required.",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Upsert: update if exists, insert if not
    const template = await CertificateTemplate.findOneAndUpdate(
      { eventId },
      {
        $set: {
          organizers: organizers,
          templateId: templateId,
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Certificate template saved successfully",
      template,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getTemplate = async (req, res) => {
  console.log("gettemplate");
  try {
    const { eventId } = req.params;
    const template = await CertificateTemplate.findOne({ eventId });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Certificate template not found",
      });
    }
    res.json({
      success: true,
      template: {
        organizers: template.organizers,
        templateId: template.templateId,
        eventId: template.eventId,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const deleteCertificate = async (req, res) => {
  const { publicId } = req.body;
  console.log("delete");
  try {
    await cloudinary.uploader.destroy(`certificate/${publicId}`, { resource_type: "raw" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  saveCertificate,
  getCertificate,
  saveTemplate,
  getTemplate,
  deleteCertificate
};
