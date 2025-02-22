require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Config for the user's data and files
const userData = {
  name: "Kabir Bose",
  email: "kabirbose04@gmail.com",
  phone: "4166253954",
  degree: "Bachelor of Technology",
  program: "Networking & IT Security",
  experience: ["Network Engineering Intern at CBC"],
  skills: ["C", "C++", "JavaScript", "TypeScript", "Python"],
  location: "Toronto, Ontario, Canada",
  address: "19 Brisbourne Grove",
  postal: "M1B1P2",
  website: "kabirbose.vercel.app",
  gender: "Male",
  ethnicity: "South Asian",
  sex: "Heterosexual",
  religion: "Prefer not to say",
  age: "21",
  disability: "No",
  pronouns: "He/him/his",
};

const fileConfig = {
  resume: "resume.pdf",
  coverLetter: "cover-letter.pdf",
};

// Helper function for delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// API retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        retries++;
        if (retries === maxRetries) throw error;
        const waitTime = initialDelay * Math.pow(2, retries - 1); // Exponential backoff
        console.log(`Rate limited. Retrying in ${waitTime}ms`);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

// Setup Puppeteer browser and go to the URL
async function setupBrowser(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(url);
  return { browser, page };
}

// Generate response for form fields using AI
async function generateAIResponse(fieldInfo, options = null) {
  const prompt = `
    You are a professional job applicant. Based on this form field:
    ${fieldInfo}
    ${
      options ? `\nAvailable options:\n${JSON.stringify(options, null, 2)}` : ""
    }
    
    Generate a professional and relevant response. The response should be:
    - Specific and detailed
    - Professionally written
    - Realistic and believable
    - Relevant to the job application context
    
    Known user background:
    ${JSON.stringify(userData, null, 2)}

    ${
      options
        ? "Select the most appropriate option from the available options list."
        : ""
    }
    By default for dropdown menus:
    1. If there's a direct match with user data, use that
    2. If "No" exists as an option, select that
    3. If neither above applies, select the first option
    
    Generate only the response text, no explanations.
    Keep the response concise unless it's clearly a long-form field like "Tell us about yourself" or "Why do you want to work here?"
  `;
  const response = await retryWithBackoff(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });
  return response;
}

// API endpoint to start the scraping process
app.get("/scrape", async (req, res) => {
  const url = req.query.url || "https://example.com"; // default URL if not provided
  try {
    const { browser, page } = await setupBrowser(url);

    // Get form elements on the page
    const formElements = await page.$$(
      'input:not([type="hidden"]), textarea, select'
    );

    // Process form fields and generate AI responses
    const responses = {};
    for (const element of formElements) {
      const label = await element.evaluate(
        (el) => el.getAttribute("aria-label") || el.placeholder || el.name
      );
      const fieldInfo = `Label: ${label}`;
      const response = await generateAIResponse(fieldInfo);
      responses[label] = response;
    }

    await browser.close();
    res.json({ success: true, responses });
  } catch (error) {
    console.error("Error during scraping:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to scrape the page" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
