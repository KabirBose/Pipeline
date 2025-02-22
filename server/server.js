const express = require("express");
const { fillForm } = require("./automate");

const app = express();
const PORT = 5001;

app.get("/run-script", async (req, res) => {
  try {
    fillForm(
      "https://sparelabs.pinpointhq.com/en/postings/06f682f6-594a-476b-aa7d-d009e3c52545/applications/new"
    ).catch(console.error);

    res.json({ success: true, title });
  } catch (error) {
    console.error("Error running Puppeteer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
