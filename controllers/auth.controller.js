const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const createToken = (user) => {
  return jwt.sign(
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
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "Un compte existe déjà avec cette adresse email.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
        },
      });

    const token = createToken(user);

    return res.status(201).json({
      message: "Compte créé avec succès.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message:
        "Erreur lors de la création du compte.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email et mot de passe obligatoires.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(401).json({
        message:
          "Email ou mot de passe incorrect.",
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return res.status(401).json({
        message:
          "Email ou mot de passe incorrect.",
      });
    }

    const token = createToken(user);

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
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message:
        "Erreur lors de la connexion.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message:
          "Adresse email obligatoire.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    const responseMessage =
      "Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.";

    if (!user) {
      return res.status(200).json({
        message: responseMessage,
      });
    }

    await prisma.resetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await prisma.resetToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId: user.id,
      },
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${frontendUrl}/password-reset?token=${resetToken}`;

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,
        to: user.email,
        subject:
          "Réinitialisation de votre mot de passe MarketFlash",
        text:
          `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`,
        html: `
          <h2>Réinitialisation du mot de passe</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe MarketFlash.</p>
          <p>
            <a href="${resetUrl}">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ce lien expire dans 1 heure.</p>
        `,
      });
    } catch (mailError) {
      console.error(
        "MAIL ERROR:",
        mailError
      );
    }

    return res.status(200).json({
      message: responseMessage,
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la demande de réinitialisation.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message:
          "Token et nouveau mot de passe obligatoires.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken =
      await prisma.resetToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: true,
        },
      });

    if (!resetToken) {
      return res.status(400).json({
        message:
          "Lien de réinitialisation invalide.",
      });
    }

    if (
      resetToken.expiresAt <
      new Date()
    ) {
      await prisma.resetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      return res.status(400).json({
        message:
          "Le lien de réinitialisation a expiré.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      }),

      prisma.resetToken.deleteMany({
        where: {
          userId: resetToken.userId,
        },
      }),
    ]);

    return res.status(200).json({
      message:
        "Mot de passe modifié avec succès.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la réinitialisation du mot de passe.",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};