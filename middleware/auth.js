const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: "Vous devez être connecté.",
    });
  }

  const parts = authorization.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res.status(401).json({
      message: "Token invalide.",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalide ou expiré.",
    });
  }
};

module.exports = auth;