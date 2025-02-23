import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { userData, fileConfig } from "./data";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
let browser;
let page;

const initialBrowserSetup = async (url: string) => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto(url);

  const pageHtml = await page.content();
  console.log(pageHtml);
};

const automation = async (url: string) => {
  initialBrowserSetup(url);
};

export { automation };
