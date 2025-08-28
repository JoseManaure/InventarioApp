const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();

router.get("/:producto", async (req, res) => {
  const { producto } = req.params;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // armo la búsqueda
    const busqueda = encodeURIComponent(producto);
    await page.goto(`https://www.construmart.cl/${busqueda}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // scrapear productos
    const productos = await page.evaluate(() => {
      const items = [];
      const productCards = document.querySelectorAll(
        ".vtex-search-result-3-x-galleryItem"
      );

      productCards.forEach((card) => {
        const nombre = card.querySelector(
          ".vtex-product-summary-2-x-productBrand"
        )?.innerText;

        const precio = card.querySelector(
          ".vtex-product-price-1-x-sellingPrice"
        )?.innerText;

        const url = card.querySelector("a")?.getAttribute("href");

        if (nombre && precio && url) {
          const precioNumero = parseInt(
            precio.replace(/[^0-9]/g, ""),
            10
          );

          items.push({
            nombre,
            precio,
            precioNumero,
            url: url.startsWith("http")
              ? url
              : `https://www.construmart.cl${url}`,
          });
        }
      });

      return items;
    });

    await browser.close();

    res.json({ productos });
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: "Error al obtener precios" });
  }
});

module.exports = router;
