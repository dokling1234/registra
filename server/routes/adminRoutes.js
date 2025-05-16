import express from "express";
import { adminLogin, getAdminData, createAdmin  } from "../controllers/adminController.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/data", userAuth, getAdminData);
router.post("/create", createAdmin);

export default router;
