const prisma = require("../lib/prisma");

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger les commandes.",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Commande introuvable.",
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger la commande.",
    });
  }
};

const getOrderBySession = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: req.params.sessionId,
        userId: req.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Commande introuvable.",
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de charger la commande.",
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  getOrderBySession,
};