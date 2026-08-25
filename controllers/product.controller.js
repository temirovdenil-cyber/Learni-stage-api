const prisma = require("../lib/prisma");

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du chargement des produits.",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du chargement du produit.",
    });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du chargement de vos produits.",
    });
  }
};

const getMyProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du chargement du produit.",
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      city,
      image,
    } = req.body;

    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !condition ||
      !city
    ) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires.",
      });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: Number(price),
        category,
        condition,
        city,
        image: image || null,
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      message: "Produit publié avec succès.",
      product,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la publication du produit.",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    if (
      product.userId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier ce produit.",
      });
    }

    const {
      title,
      description,
      price,
      category,
      condition,
      city,
      image,
    } = req.body;

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        price: Number(price),
        category,
        condition,
        city,
        image: image || product.image,
      },
    });

    return res.status(200).json({
      message: "Produit modifié avec succès.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la modification du produit.",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    if (
      product.userId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez pas supprimer ce produit.",
      });
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: "Produit supprimé avec succès.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors de la suppression du produit.",
    });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger les produits.",
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getMyProducts,
  getMyProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
};