const puppeteer = require('puppeteer');
const levenshtein = require('fast-levenshtein');

async function buscarConstrumart(nombreProducto) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.construmart.cl', { waitUntil: 'networkidle2' });

    // Escribir en el buscador
    await page.waitForSelector('input[placeholder="Buscar productos"]', { timeout: 7000 });
    await page.type('input[placeholder="Buscar productos"]', nombreProducto, { delay: 50 });

    // Esperar que aparezcan sugerencias del autocomplete
    await page.waitForSelector('.autocomplete-list li', { timeout: 7000 });

    // Extraer productos
    const productos = await page.$$eval('.autocomplete-list li', items =>
      items.map(item => {
        const nombre = item.querySelector('.product-name')?.innerText.trim() || '';
        const precioTexto = item.querySelector('.price')?.innerText || '';
        const precio = Number(precioTexto.replace(/[^\d]/g, ''));
        return { nombre, precio };
      })
    );

    await browser.close();

    // Ordenar por similitud
    const ordenados = productos
      .map(p => ({
        ...p,
        distancia: levenshtein.get(nombreProducto.toLowerCase(), p.nombre.toLowerCase())
      }))
      .sort((a, b) => a.distancia - b.distancia);

    // Filtrar si son demasiado diferentes (opcional)
    return ordenados.filter(p => p.distancia <= 12).slice(0, 3); // devuelve los 3 más similares

  } catch (err) {
    await browser.close();
    console.error('❌ Error al buscar producto en Construmart:', err.message);
    return [];
  }
}

module.exports = buscarConstrumart;
