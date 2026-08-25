const express = require("express");
const productController = require("../controllers/product.controller");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

router.get("/products", productController.getProducts);
router.get("/products/:id", productController.getProduct);

router.get(
  "/my-products",
  auth,
  productController.getMyProducts
);

router.get(
  "/my-products/:id",
  auth,
  productController.getMyProduct
);

router.post(
  "/products",
  auth,
  productController.createProduct
);

router.put(
  "/products/:id",
  auth,
  productController.updateProduct
);

router.delete(
  "/products/:id",
  auth,
  productController.deleteProduct
);

router.get(
  "/admin/products",
  auth,
  admin,
  productController.getAdminProducts
);

module.exports = router;