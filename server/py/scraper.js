// scraper.js
const puppeteer = require('puppeteer');

async function obtenerPrecioConstrumart(producto) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const query = encodeURIComponent(producto);
  const urlBusqueda = `https://www.construmart.cl/search/?text=${query}`;

  await page.goto(urlBusqueda, { waitUntil: 'domcontentloaded' });

  // Clic en el primer resultado
  const enlaceProducto = await page.$eval('.product-tile-link', el => el.href);
  await page.goto(enlaceProducto, { waitUntil: 'domcontentloaded' });

  const precio = await page.$eval('.price-wrapper .sales', el => el.innerText);

  console.log(`Producto: ${producto}`);
  console.log(`URL: ${enlaceProducto}`);
  console.log(`Precio: ${precio}`);

  await browser.close();
}

obtenerPrecioConstrumart('cemento especial polpaico 25 kg');
