const express = require("express");
const router = express.Router();
  
// const OpenAI = require("openai");

// Inicializar cliente de OpenAI

// const client = new OpenAI({

//  apiKey: process.env.OPENAI_API_KEY, // ⚠️ debe estar en tu .env
  
//  });

// Ruta para recibir mensajes
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // puedes usar gpt-4o-mini o gpt-4o
      messages: [{ role: "user", content: message }],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error en chat:", error);
    res.status(500).json({ error: "Error en el servidor de chat" });
  }
});

module.exports = router;
