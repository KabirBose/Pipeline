// backend/server.js
const express = require("express");
const cors = require("cors");
const formFiller = require("./formFiller"); // Your existing code in a separate file
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/fill-form", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Start the form filling process
    await formFiller.fillForm(url);
    res.json({ message: "Form filling process started" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process form filling" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
