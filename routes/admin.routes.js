const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.get(
  "/admin/dashboard",
  auth,
  admin,
  adminController.getDashboard
);

router.get(
  "/admin/users",
  auth,
  admin,
  adminController.getUsers
);

module.exports = router;