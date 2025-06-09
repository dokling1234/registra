const express = require('express');
const { saveCertificate, getCertificate, saveTemplate, getTemplate, deleteCertificate } = require('../controllers/certificateController.js');
const { uploadFile, uploadCertificateTemplate } = require('../controllers/uploadController.js');
const userAuth = require('../middleware/userAuth.js');
const multer = require('multer');
const path = require('path');

const certificateRoutes = express.Router();

// Configure multer for file uploads

// Save or update certificate
certificateRoutes.post('/save', userAuth, saveCertificate);

// Get certificate for a specific event
certificateRoutes.get('/event/:id', userAuth, getCertificate);//eventId

// Save certificate template
certificateRoutes.post('/save-template', userAuth, saveTemplate);

// Get certificate template
certificateRoutes.get('/template/:eventId/:templateName?', getTemplate);

certificateRoutes.post('/delete-certificate', deleteCertificate);

// certificateRoutes.post('/upload-signature', uploadSignature);

module.exports = certificateRoutes;