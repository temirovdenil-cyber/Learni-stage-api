const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const auth = async (req, res, next) => {
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

  try {
    const decoded = jwt.verify(
      parts[1],
      process.env.JWT_SECRET
    );

    const userId = Number(
      decoded.id ?? decoded.userId
    );

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        message: "Token invalide.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Utilisateur introuvable.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalide ou expiré.",
    });
  }
};

module.exports = auth;