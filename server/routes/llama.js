// routes/llama.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const axios = require('axios');
const { spawn } = require('child_process');

/**
 * 🤖 Endpoint principal para consultar tu modelo LLaMA
 * 
 * Admite dos modos:
 *  1️⃣ LOCAL llama.cpp (ejecuta tu modelo en tu servidor)
 *  2️⃣ API REMOTA (si tu modelo LLaMA corre como microservicio o en otra máquina)
 * 
 * Configura el modo en tu archivo .env:
 *    LLAAMA_MODE=local     // o "api"
 *    LLAMA_API_URL=http://localhost:8000/completion
 */
const MODE = process.env.LLAMA_MODE || 'local';
const LLAMA_API_URL = process.env.LLAMA_API_URL || 'http://localhost:8000/completion';

router.post('/query', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

    console.log(`🧠 Consulta LLaMA (${MODE}) del usuario ${req.user.id}:`, prompt);

    // =============== 🔹 MODO LOCAL llama.cpp 🔹 ===============
    if (MODE === 'local') {
      // Asume que tienes un ejecutable ./llama en la raíz del proyecto
      const llama = spawn('./llama', [
        '--model', 'models/llama.gguf',
        '--prompt', prompt,
        '--n-predict', '300'
      ]);

      let output = '';
      llama.stdout.on('data', data => (output += data.toString()));

      llama.stderr.on('data', data => console.error('LLaMA stderr:', data.toString()));

      llama.on('close', () => {
        res.json({
          user: req.user.id,
          response: output.trim(),
        });
      });

      return;
    }

    // =============== 🔹 MODO API REMOTA 🔹 ===============
    if (MODE === 'api') {
      const response = await axios.post(LLAMA_API_URL, {
        prompt,
        temperature: 0.7,
        max_tokens: 300,
      });

      return res.json({
        user: req.user.id,
        response: response.data?.text || response.data,
      });
    }

    return res.status(400).json({ error: 'Modo LLaMA no configurado correctamente' });

  } catch (error) {
    console.error('❌ Error al consultar LLaMA:', error);
    res.status(500).json({ error: 'Error interno al procesar el prompt' });
  }
});

module.exports = router;
