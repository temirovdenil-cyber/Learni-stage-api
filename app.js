const express = require("express");
const cors = require("cors");

const { buildCorsOptions } = require("./config/cors");
const productRoutes = require("./routes/product.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors(buildCorsOptions()));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "MarketFlash API" });
});

app.use(productRoutes);
app.use(authRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur.";

  res.status(statusCode).json({ message });
});

module.exports = app;
