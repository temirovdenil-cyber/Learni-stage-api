const prisma = require("../lib/prisma");

const getFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        product: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(
      favorites.map((favorite) => favorite.product)
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger les favoris.",
    });
  }
};

const getFavoriteStatus = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    return res.status(200).json({
      favorite: Boolean(favorite),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de vérifier le favori.",
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        productId,
      },
    });

    return res.status(201).json({
      message: "Produit ajouté aux favoris.",
      favorite,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible d'ajouter le favori.",
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    return res.status(200).json({
      message: "Produit retiré des favoris.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de retirer le favori.",
    });
  }
};

module.exports = {
  getFavorites,
  getFavoriteStatus,
  addFavorite,
  removeFavorite,
};