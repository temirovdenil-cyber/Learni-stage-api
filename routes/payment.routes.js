const express = require("express");
const paymentController = require("../controllers/payment.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.post(
  "/checkout",
  auth,
  paymentController.createCheckoutSession
);

module.exports = router;