import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { userData } from "./data";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const geminiInjection = async (pageHtml: string) => {
  const prompt = `Use the HTML I have provided: ${pageHtml}, and the user data: ${userData} to fill out job application forms accurately.`;
  const result = await model.generateContent(prompt);
  console.log(result.response.text);
};

const initialBrowserSetup = async (url: string) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  const pageHtml = await page.content();
  await geminiInjection(pageHtml);
};

export { initialBrowserSetup };
