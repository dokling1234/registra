const express = require("express");
const {
  createSuperAdmin,
  disableUser,
  enableUser,
  updateUser,
  cancelEvent,
} = require("../controllers/superAdminController.js");
const userAuth = require("../middleware/userAuth.js");
const superAdminRouter = express.Router();

superAdminRouter.post("/create", createSuperAdmin);
superAdminRouter.put("/disable-user/:id", disableUser);
superAdminRouter.put("/enable-user/:id", enableUser);
superAdminRouter.put("/update/:id", updateUser);
superAdminRouter.put("/cancel-event/:id",  cancelEvent);

module.exports = superAdminRouter;
