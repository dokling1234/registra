const express = require("express");
const {
  registerSuperadmin,
  disableUser,
  enableUser,
  updateUser,
  cancelEvent
} = require("../controllers/superAdminController.js");
const userAuth = require("../middleware/userAuth.js");
const superAdminRouter = express.Router();

superAdminRouter.post("/register", userAuth, registerSuperadmin);
superAdminRouter.put("/disable-user/:id", disableUser);
superAdminRouter.put("/enable-user/:id", enableUser);
superAdminRouter.put("/update/:id", updateUser);
superAdminRouter.put("/cancel-event/:id",  cancelEvent);
module.exports = superAdminRouter;
