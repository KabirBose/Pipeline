import express from "express";
import { fillForm } from "./automate";
import { url } from "./data";

const app = express();
const PORT = 5001;

app.get("/run-script", async (req, res) => {
  try {
    await fillForm(url).catch(console.error);

    res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, error: "An unknown error occurred" });
    }
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
