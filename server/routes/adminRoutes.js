const express = require("express");
const puppeteer = require("puppeteer");

const {
  adminLogin,
  getAdminData,
  createAdmin,
  getEvents,
  registerForEvent,
  QRchecker,
  pdfCertificate,
  getAllUsers,
  changeAdminPassword,
  getFeedbackQuestionReport,
  getEventAnalyticsReport,
  samplePdf,
} = require("../controllers/adminController.js");
const userAuth = require("../middleware/userAuth.js");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/data", userAuth, getAdminData);
router.post("/create", createAdmin);
router.get("/events", getEvents);
router.post("/event_register/:id", registerForEvent);
router.put("/attendance/update", QRchecker);
router.post("/uploadCertificate", pdfCertificate);
router.get("/alldata", getAllUsers);
router.post("/change-password", changeAdminPassword);
router.post("/events/:id/feedback/:qIndex/report", getFeedbackQuestionReport);
router.get("/events/:id/report", getEventAnalyticsReport);
router.get("/events/sample", samplePdf);
router.get("/generate-pdf", async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent("<h1>Hello, PDF!</h1>");
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="test.pdf"');
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Failed to generate PDF");
  }
});
module.exports = router;
