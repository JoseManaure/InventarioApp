const express = require('express');
const router = express.Router();
const buscarConstrumartAutocomplete = require('../scrapers/construmartAutocomplete');
const buscarConstrumart = require('../scrapers/construmart');
const Item = require('../models/Item');

router.get('/todos', async (req, res) => {
  try {
    const itemsLocales = await Item.find().limit(1); // límite 10 para evitar saturar

    const resultados = [];

    for (const item of itemsLocales) {
        console.log(`Buscando producto: ${item.nombre}`); // LOG para saber en qué producto va
      const externo = await buscarConstrumartAutocomplete(item.nombre);

      // Diferencia solo si ambos precios son válidos
      let diferencia = null;
      if (item.precio && externo.precio != null) {
        diferencia = item.precio - externo.precio;
      }

      resultados.push({
        nombreLocal: item.nombre,
        precioLocal: item.precio,
        nombreExterno: externo.nombreProducto || 'No encontrado',
        precioExterno: externo.precio,
        urlExterno: externo.urlProducto,
        diferencia
      });

      // Espera 1.5 seg entre cada búsqueda para no saturar
      await new Promise(r => setTimeout(r, 1500));
    }

    res.json(resultados);
  } catch (err) {
    console.error('Error comparar todos:', err);
    res.status(500).json({ error: 'Error al comparar todos los productos' });
  }
});

module.exports = router;
