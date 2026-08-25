const express = require("express");
const auth = require("../middleware/auth");
const favoriteController = require("../controllers/favorite.controller");

const router = express.Router();

router.get("/favorites", auth, favoriteController.getFavorites);

router.get(
  "/favorites/:id/status",
  auth,
  favoriteController.getFavoriteStatus
);

router.post(
  "/favorites/:id",
  auth,
  favoriteController.addFavorite
);

router.delete(
  "/favorites/:id",
  auth,
  favoriteController.removeFavorite
);

module.exports = router;