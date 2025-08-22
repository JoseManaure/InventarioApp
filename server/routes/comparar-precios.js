// routes/compararPrecios.js
const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();

router.get("/:producto", async (req, res) => {
  const { producto } = req.params;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const url = `https://www.construmart.cl/${encodeURIComponent(producto)}?_q=${encodeURIComponent(producto)}&map=ft`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForSelector("div.vtex-product-summary-2-x-container", { timeout: 60000 });

    const productos = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("div.vtex-product-summary-2-x-container").forEach(el => {
        const nombre = el.querySelector("span.vtex-product-summary-2-x-productBrand")?.innerText || "Sin nombre";
        const precio = el.querySelector("span.vtex-product-price-1-x-sellingPriceValue")?.innerText || "Sin precio";
        const link = el.querySelector("a")?.href || "#";
        items.push({ nombre, precio, link });
      });
      return items;
    });

    await browser.close();
    res.json({ productos });
  } catch (error) {
    console.error("Error Puppeteer:", error.message);
    res.status(500).json({ error: "No se pudo obtener la información del producto" });
  }
});

module.exports = router;
