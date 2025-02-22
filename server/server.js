const express = require("express");
const path = require("path");
const { fillForm } = require("./automate");

const app = express();
app.use(express.static(path.join(__dirname, "client", "dist")));
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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
