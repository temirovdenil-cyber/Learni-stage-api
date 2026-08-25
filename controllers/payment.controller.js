const Stripe = require("stripe");
const prisma = require("../lib/prisma");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  let order = null;

  try {
    const { products, shipping } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        message: "Le panier est vide.",
      });
    }

    if (
      !shipping ||
      !shipping.name ||
      !shipping.address ||
      !shipping.city ||
      !shipping.postalCode ||
      !shipping.phone
    ) {
      return res.status(400).json({
        message: "Les informations de livraison sont incomplètes.",
      });
    }

    const quantities = new Map();

    products.forEach((product) => {
      const id = Number(product.id);
      const quantity = Number(product.quantity);

      if (id && quantity > 0) {
        quantities.set(id, quantity);
      }
    });

    const productIds = [...quantities.keys()];

    const databaseProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (databaseProducts.length !== productIds.length) {
      return res.status(400).json({
        message: "Un ou plusieurs produits n'existent plus.",
      });
    }

    const total = databaseProducts.reduce((sum, product) => {
      return sum + product.price * quantities.get(product.id);
    }, 0);

    order = await prisma.order.create({
      data: {
        userId: req.user.id,
        status: "PENDING",
        total,
        name: shipping.name,
        address: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        phone: shipping.phone,
        items: {
          create: databaseProducts.map((product) => ({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: quantities.get(product.id),
            image: product.image,
          })),
        },
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: databaseProducts.map((product) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: product.title,
            ...(product.image
              ? {
                  images: [product.image],
                }
              : {}),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: quantities.get(product.id),
      })),
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/panier`,
      metadata: {
        orderId: String(order.id),
        userId: String(req.user.id),
      },
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        stripeSessionId: session.id,
      },
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error(error);

    if (order) {
      try {
        await prisma.order.delete({
          where: {
            id: order.id,
          },
        });
      } catch {}
    }

    return res.status(500).json({
      message: "Impossible de créer la session de paiement.",
    });
  }
};

const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error(error);

    return res.status(400).send("Webhook invalide");
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;

      if (session.payment_status === "paid") {
        await prisma.order.updateMany({
          where: {
            stripeSessionId: session.id,
          },
          data: {
            status: "PAID",
          },
        });
      }
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      received: false,
    });
  }
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
};