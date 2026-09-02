const express = require("express");

const {
  getDashboard,
  getOrders,
  getUsers,
} = require("../controllers/admin.controller");

const {
  getAdminProducts,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/admin/dashboard", getDashboard);
router.get("/admin/orders", getOrders);
router.get("/admin/products", getAdminProducts);
router.get("/admin/users", getUsers);

module.exports = router;