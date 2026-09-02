const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const paymentRoutes = require("./routes/payment.routes");
const orderRoutes = require("./routes/order.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const adminRoutes = require("./routes/admin.routes");

const {
  stripeWebhook,
} = require("./controllers/payment.controller");

const app = express();

app.post(
  "/stripe/webhook",
  express.raw({
    type: "application/json",
  }),
  stripeWebhook
);

const allowedOrigins = [
  "https://learni-stage-front.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origine non autorisée par CORS : ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MarketFlash API",
  });
});

app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", paymentRoutes);
app.use("/", orderRoutes);
app.use("/", favoriteRoutes);
app.use("/", adminRoutes);

module.exports = app;