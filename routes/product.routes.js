const express = require("express");
const productController = require("../controllers/product.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/products", productController.getProducts);

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

router.get("/products/:id", productController.getProduct);

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

module.exports = router;