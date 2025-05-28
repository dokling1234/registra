const express = require("express");
const { adminLogin, getAdminData, createAdmin,
    getEvents,
    registerForEvent,
    QRchecker,
    pdfCertificate
 } = require("../controllers/adminController.js");
const userAuth = require("../middleware/userAuth.js");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/data", userAuth, getAdminData);
router.post("/create", createAdmin);
router.get('/events', getEvents);
router.post('/event_register/:id', registerForEvent);
router.put('/attendance/update', QRchecker);
router.post('/uploadCertificate', pdfCertificate);

module.exports = router;