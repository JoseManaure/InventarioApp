const puppeteer = require('puppeteer');

function parsePrecio(precioText) {
  if (!precioText) return null;
  // Ejemplo: "$ 12.345"
  const num = precioText.replace(/[^\d,.-]/g, '').replace(',', '.'); 
  return parseFloat(num) || null;
}

async function buscarConstrumartAutocomplete(producto) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.construmart.cl/', { waitUntil: 'domcontentloaded' });

    await page.type('input[name="search"]', producto, { delay: 100 });
    await page.waitForSelector('.autocomplete-list li', { timeout: 5000 });

    const terminoSugerido = await page.$eval('.autocomplete-list li', el => el.textContent.trim());
    await page.click('.autocomplete-list li');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    const nombreProducto = await page.$eval('h1.product-title', el => el.textContent.trim());

    let precioText = 'No disponible';
    try {
      precioText = await page.$eval('.price-sales', el => el.textContent.trim());
    } catch {
      try {
        precioText = await page.$eval('.price', el => el.textContent.trim());
      } catch {
        precioText = null;
      }
    }

    const precio = parsePrecio(precioText);

    await browser.close();

    return {
      terminoSugerido,
      nombreProducto,
      precio,
      precioText,
      urlProducto: page.url()
    };
  } catch (error) {
    await browser.close();
    return {
      terminoSugerido: null,
      nombreProducto: null,
      precio: null,
      precioText: null,
      urlProducto: null,
      error: error.message
    };
  }
}

module.exports = buscarConstrumartAutocomplete;
