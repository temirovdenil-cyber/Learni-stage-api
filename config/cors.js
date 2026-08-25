const buildCorsOptions = () => ({
  origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
});

module.exports = {
  buildCorsOptions,
};
