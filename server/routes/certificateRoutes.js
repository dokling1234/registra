const express = require('express');
const { saveCertificate, getCertificate, saveTemplate, getTemplate } = require('../controllers/certificateController.js');
const { uploadFile, uploadCertificateTemplate } = require('../controllers/uploadController.js');
const userAuth = require('../middleware/userAuth.js');
const multer = require('multer');
const path = require('path');

const certificateRoutes = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // For certificate templates, accept PDFs
    if (req.path === '/upload-template') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for certificate templates!'));
      }
    } else {
      // For signatures, accept images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  }
});



// Save or update certificate
certificateRoutes.post('/save', userAuth, saveCertificate);

// Get certificate for a specific event
certificateRoutes.get('/event/:eventId', userAuth, getCertificate);

// Upload signature image
certificateRoutes.post('/upload-signature', userAuth, upload.single('file'), uploadFile);

// Upload certificate template
certificateRoutes.post('/upload-template', userAuth, upload.single('file'), uploadCertificateTemplate);

// Save certificate template
certificateRoutes.post('/save-template', userAuth, saveTemplate);

// Get certificate template
certificateRoutes.get('/template/:eventId', getTemplate);

module.exports = certificateRoutes;