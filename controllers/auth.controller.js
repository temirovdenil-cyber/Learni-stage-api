const prisma = require("../lib/prisma");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Un compte existe déjà avec cet email.",
      });
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Compte créé avec succès.",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la création du compte.",
    });
  }
};

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe obligatoires.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const validPassword = await argon2.verify(
      user.password,
      password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la connexion.",
    });
  }
};

module.exports = {
  register,
  login,
};