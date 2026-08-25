const prisma = require("../lib/prisma");
const argon2 = require("argon2");
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
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères.",
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

    const token = createToken(user);

    return res.status(201).json({
      message: "Compte créé avec succès.",
      token,
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
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

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

    let validPassword = false;

    try {
      validPassword = await argon2.verify(
        user.password,
        password
      );
    } catch {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (!validPassword) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
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
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la connexion.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email obligatoire.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(200).json({
        message:
          "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
      });
    }

    await prisma.resetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await prisma.resetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 30 * 60 * 1000
        ),
      },
    });

    const resetUrl =
      `${process.env.FRONTEND_URL}/password-reset?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe MarketFlash",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <h2 style="color:#17212B">Réinitialiser votre mot de passe</h2>
          <p>Bonjour ${user.name},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe MarketFlash.</p>
          <p>Ce lien est valable pendant 30 minutes.</p>
          <a
            href="${resetUrl}"
            style="display:inline-block;background:#F5A623;color:#17212B;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold"
          >
            Réinitialiser mon mot de passe
          </a>
          <p style="margin-top:25px;color:#667085;font-size:13px">
            Si vous n'avez pas demandé cette modification, ignorez cet email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Impossible d'envoyer le lien de réinitialisation.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = req.body.token;
    const password = req.body.password;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token et mot de passe obligatoires.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.resetToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (
      !resetToken ||
      resetToken.expiresAt < new Date()
    ) {
      if (resetToken) {
        await prisma.resetToken.delete({
          where: {
            id: resetToken.id,
          },
        });
      }

      return res.status(400).json({
        message:
          "Ce lien de réinitialisation est invalide ou expiré.",
      });
    }

    const hashedPassword = await argon2.hash(password);

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
        "Votre mot de passe a été modifié avec succès.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Impossible de réinitialiser le mot de passe.",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};