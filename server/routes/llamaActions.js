const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { spawn } = require('child_process');
const Cotizacion = require('../models/Cotizacion');
const Producto = require('../models/Producto');

router.post('/cotizacion', verifyToken, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

  try {
    // Ejecuta LLaMA localmente
    const llama = spawn('./llama', [
      '--model', 'models/llama.gguf',
      '--prompt', prompt,
      '--n-predict', '300'
    ]);

    let output = '';
    llama.stdout.on('data', data => output += data.toString());
    llama.stderr.on('data', data => console.error('LLaMA stderr:', data.toString()));

    llama.on('close', async () => {
      let json;
      try {
        json = JSON.parse(output); // espera JSON de LLaMA
      } catch {
        return res.status(500).json({ error: 'JSON inválido de LLaMA', raw: output });
      }

      if (json.action === 'create_cotizacion') {
        const detalles = await Promise.all(json.productos.map(async p => {
          const producto = await Producto.findById(p.id);
          return {
            productoId: p.id,
            nombre: producto.nombre,
            cantidad: p.cantidad,
            precioUnitario: producto.precio,
            subtotal: producto.precio * p.cantidad,
          };
        }));
        const cotizacion = await Cotizacion.create({ clienteId: json.clienteId, detalles });
        return res.json({ success: true, cotizacion });
      }

      res.status(400).json({ error: 'Acción no soportada' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
