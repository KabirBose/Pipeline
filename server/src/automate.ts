import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { userData, fileConfig } from "./data";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
let browser;
let page;

const initialBrowserSetup = async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto("https://developer.chrome.com/");
};

export { initialBrowserSetup };
