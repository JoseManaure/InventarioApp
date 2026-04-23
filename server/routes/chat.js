const express = require("express");
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
// const OpenAI = require("openai");

// Inicializar cliente de OpenAI

// const client = new OpenAI({

//  apiKey: process.env.OPENAI_API_KEY, // ⚠️ debe estar en tu .env
  
//  });

router.post('/query', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

    let output = "Respuesta de ejemplo"; // reemplazar con llama.cpp o API

    // RESPUESTA AL USUARIO
    res.json({ user: req.user.id, response: output.trim() });

    // GUARDADO EN DB
    const Chat = require('../models/Chat');
    try {
      await Chat.create({
        userId: req.user.id,
        prompt,
        response: output.trim()
      });
    } catch (err) {
      console.error("Error guardando chat:", err);
    }
  } catch (err) {
    console.error('Error LLaMA:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});



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
