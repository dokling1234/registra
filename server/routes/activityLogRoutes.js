const express = require("express");
const { listLogs } = require("../controllers/activityLogController.js");
const userAuth = require("../middleware/userAuth.js");

const router = express.Router();

router.get("/", userAuth, listLogs);

module.exports = router; 