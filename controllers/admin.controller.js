const prisma = require("../lib/prisma");

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger les utilisateurs.",
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const [
      users,
      products,
      orders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);

    return res.status(200).json({
      users,
      products,
      orders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger le dashboard.",
    });
  }
};

module.exports = {
  getUsers,
  getDashboard,
};