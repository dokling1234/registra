import express from "express";
const mobileAdminRouter = express.Router();

import {
  adminLogin,
  getAdminData,
  createAdmin,
} from "../mobile_admin_controller/admin.controller.js";
import { userAuth } from "../mobile_admin_middleware/userAuth.js";

mobileAdminRouter.post("/login", adminLogin);
mobileAdminRouter.get("/data", userAuth, getAdminData);
mobileAdminRouter.post("/create", createAdmin);

export default mobileAdminRouter;
