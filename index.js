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

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API lancée sur http://localhost:${PORT}`);
});