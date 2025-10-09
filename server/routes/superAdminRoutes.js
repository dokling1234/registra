const express = require("express");
const {
  createSuperAdmin,
  disableUser,
  enableUser,
  updateUser,
  cancelEvent,
  updateAdminOrSuperadmin, uncancelEventController
} = require("../controllers/superAdminController.js");
const superAdminRouter = express.Router();

superAdminRouter.post("/create", createSuperAdmin);
superAdminRouter.put("/disable-user/:id", disableUser);
superAdminRouter.put("/enable-user/:id", enableUser);
superAdminRouter.put("/update/:id", updateUser);
superAdminRouter.put("/cancel-event/:id", cancelEvent);
superAdminRouter.put("/admin/update/:id", updateAdminOrSuperadmin);
superAdminRouter.put("/uncancel-event/:eventId", uncancelEventController);

module.exports = superAdminRouter;
