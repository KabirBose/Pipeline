import express from "express";
import { automation } from "./automate";

const app = express();
const PORT = 5001;

app.get("/run-script", async (req, res) => {
  try {
    await automation("https://example.com/");

    res.json({ success: true, title: "Form submitted successfully" });
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
