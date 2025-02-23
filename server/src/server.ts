import express from "express";
import { fillForm } from "./automate";

const app = express();

const PORT = 5001;
const URL =
  "https://sparelabs.pinpointhq.com/en/postings/06f682f6-594a-476b-aa7d-d009e3c52545/applications/new";

app.get("/run-script", async (req, res) => {
  try {
    await fillForm(URL).catch(console.error);

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
