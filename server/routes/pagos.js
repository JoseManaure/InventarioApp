// server/routes/pagos.js
const express = require("express");
const router = express.Router();
// const Stripe = require("stripe");

// Inicializa Stripe con tu clave secreta (ponla en .env)
// const 
// stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Crear sesión de pago en Stripe
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { notaId, monto } = req.body;

    if (!notaId || !monto) {
      return res.status(400).json({ error: "Faltan datos (notaId o monto)" });
    }

    // Crear la sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "clp", // pesos chilenos
            product_data: {
              name: `Nota de venta #${notaId}`,
            },
            unit_amount: Math.round(monto * 100), // Stripe trabaja en centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cancel",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Error creando sesión de pago:", err.message);
    res.status(500).json({ error: "No se pudo crear la sesión de pago" });
  }
});

module.exports = router;
