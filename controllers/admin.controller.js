const prisma = require("../lib/prisma");

const getDashboard = async (req, res) => {
  try {
    const [
      usersCount,
      productsCount,
      ordersCount,
      paidOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.product.count(),

      prisma.order.count(),

      prisma.order.findMany({
        where: {
          status: "PAID",
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),

      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const revenue = paidOrders.reduce(
      (sum, order) => {
        return sum + Number(order.total);
      },
      0
    );

    const averageOrder =
      paidOrders.length > 0
        ? revenue / paidOrders.length
        : 0;

    const sales = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date();

      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const dayRevenue = paidOrders
        .filter((order) => {
          const date =
            new Date(order.createdAt);

          return (
            date >= start &&
            date < end
          );
        })
        .reduce(
          (sum, order) =>
            sum + Number(order.total),
          0
        );

      sales.push({
        date:
          start.toLocaleDateString(
            "fr-FR",
            {
              weekday: "short",
            }
          ),
        revenue: dayRevenue,
      });
    }

    return res.status(200).json({
      stats: {
        revenue,
        orders: ordersCount,
        averageOrder,
        users: usersCount,
        products: productsCount,
      },

      sales,

      recentOrders:
        recentOrders.map((order) => ({
          id: order.id,
          customer: order.user.name,
          email: order.user.email,
          total: Number(order.total),
          status: order.status,
          date: order.createdAt,
        })),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erreur lors du chargement du dashboard.",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders =
      await prisma.order.findMany({
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

          items: true,
        },
      });

    return res.status(200).json(
      orders.map((order) => ({
        id: order.id,
        customer: order.user.name,
        email: order.user.email,
        total: Number(order.total),
        status: order.status,
        date: order.createdAt,
        items: order.items,
      }))
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erreur lors du chargement des commandes.",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users =
      await prisma.user.findMany({
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
      message:
        "Erreur lors du chargement des utilisateurs.",
    });
  }
};

module.exports = {
  getDashboard,
  getOrders,
  getUsers,
};