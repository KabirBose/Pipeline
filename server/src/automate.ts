const dotenv = require("dotenv");
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { userData, fileConfig } from "./data";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const initialBrowserSetup = async (url: string) => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto(url);

  const pageHtml = await page.content();
  console.log(process.env.GEMINI_API_KEY);
  geminiInjection(pageHtml);
};

const geminiInjection = async (pageHtml: string) => {
  const prompt = `Use the HTML I have provided: ${pageHtml}, and the user data: ${userData} to fill out job application forms.
  Search through the pageHtml data I have provided and look for forms or form information, then use the user data I have provided to populate
  the fields accurately. Note this is a job application form so accuracy and professionalism are key. Accurately populate the fields using
  the user data provided, and use analysis to populate fields that do not have information provided for them. Use your best knowledge, but
  do not outright lie or make up answers.`;

  const result = await model.generateContent(prompt);
  console.log(result.response.text);
};

const automation = async (url: string) => {
  initialBrowserSetup(url);
};

export { automation };
