const express = require("express");
const auth = require("../middleware/auth");
const {
  getMyOrders,
  getOrderById,
  getOrderBySession,
} = require("../controllers/order.controller");

const router = express.Router();

router.get("/my-orders", auth, getMyOrders);
router.get("/orders/session/:sessionId", auth, getOrderBySession);
router.get("/orders/:id", auth, getOrderById);

module.exports = router;