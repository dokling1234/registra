const Certificate = require('../models/certificateModel.js');
const Event = require('../models/eventModel.js');
const CertificateTemplate = require('../models/certificateTemplateModel.js');

const saveCertificate = async (req, res) => {
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
        message: 'Certificate updated successfully',
        certificate: existingCertificate 
      });
    }

    // Create new certificate
    const newCertificate = new Certificate({
      eventId,
      userId,
      certificateUrl
    });

    await newCertificate.save();
    res.status(201).json({ 
      success: true, 
      message: 'Certificate saved successfully',
      certificate: newCertificate 
    });
  } catch (err) {
    console.error('Error saving certificate:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

const getCertificate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId; // From auth middleware
console.log("getCertificate", eventId, userId)
    const certificate = await Certificate.findOne({ eventId, userId });
    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    res.json({ 
      success: true, 
      certificate 
    });
    console.log("Certificate fetched successfully")
  } catch (err) {
    console.log("Error fetching certificate:")

    console.error('Error fetching certificate:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

const saveTemplate = async (req, res) => {
  try {
    console.log("saveTemplate", req.body)
    const { eventId, templateUrl, organizers } = req.body;
console.log("saveTemplate", req.body)
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find existing template or create new one
    let template = await CertificateTemplate.findOne({ eventId });
    if (template) {
      // Update existing template
      template.templateUrl = templateUrl;
      template.organizers = organizers;
    } else {
      // Create new template
      template = new CertificateTemplate({
        eventId,
        templateUrl,
        organizers
      });
    }

    await template.save();

    res.json({
      success: true,
      message: 'Certificate template saved successfully',
      template
    });
  } catch (err) {
    console.error('Error saving certificate template:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

const getTemplate = async (req, res) => {
  try {
console.log("gettemplate+++++++")
    const { eventId } = req.params;
    
    const template = await CertificateTemplate.findOne({ eventId });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Certificate template not found'
      });
    }
    console.log("Certificate template fetched successfully")
    res.json({
      success: true,
      template
    });
  } catch (err) {
    console.error('Error fetching certificate template:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  saveCertificate,
  getCertificate,
  saveTemplate,
  getTemplate
};