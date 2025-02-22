const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 5001;

app.get("/run-script", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto("https://google.com");

    const title = await page.title();

    await new Promise((resolve) => setTimeout(resolve, 5000));

    await browser.close();

    res.json({ success: true, title });
  } catch (error) {
    console.error("Error running Puppeteer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
