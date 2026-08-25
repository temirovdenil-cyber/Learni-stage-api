const admin = (req, res, next) => {
  if (
    !req.user ||
    req.user.role !== "ADMIN"
  ) {
    return res.status(403).json({
      message: "Accès administrateur requis.",
    });
  }

  next();
};

module.exports = admin;