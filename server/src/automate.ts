import dotenv from "dotenv";
import puppeteer, { Page } from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileConfig, userData } from "./data";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
let browser;
let page: any;

// helper function for delays
const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

// helper function to handle API retries
async function retryWithBackoff(fn: any, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429) {
        // Rate limit error
        retries++;
        if (retries === maxRetries) throw error;

        const waitTime = initialDelay * Math.pow(2, retries - 1); // Exponential backoff
        console.log(
          `Rate limited. Waiting ${waitTime}ms before retry ${retries}/${maxRetries}`
        );
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

// opens the browser and goes to the url provided
async function setupBrowser(url: string) {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(url);
}

// get the following form elements (input, textarea, dropdowns)
async function getFormElements() {
  return await page.$$('input:not([type="hidden"]), textarea, select');
}

// get the labels for input elements
async function getFieldLabel(element: any) {
  try {
    const labelText = await element.evaluate((el: any) => {
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) return label.textContent;
      }

      const parentLabel = el.closest("label");
      if (parentLabel) return parentLabel.textContent;

      const previous = el.previousElementSibling;
      if (
        previous &&
        (previous.tagName === "LABEL" || previous.tagName === "DIV")
      ) {
        return previous.textContent;
      }

      return "";
    });

    return labelText.trim();
  } catch (error) {
    return "";
  }
}

// handle file upload fields
async function handleFileUpload(element: any, label: any) {
  try {
    const labelLower = label.toLowerCase();
    let filePath;

    if (labelLower.includes("resume") || labelLower.includes("cv")) {
      filePath = path.resolve(fileConfig.resume);
    } else if (labelLower.includes("cover") && labelLower.includes("letter")) {
      filePath = path.resolve(fileConfig.coverLetter);
    }

    if (filePath) {
      const inputElement = await element;
      await inputElement.uploadFile(filePath);
      console.log(`Uploaded file: ${filePath}`);
      await delay(1000);
    }
  } catch (error) {
    console.error(`Error uploading file for ${label}:`, error);
  }
}

// get dropdown options
async function getSelectOptions(element: any) {
  return await element.evaluate((el: any) =>
    Array.from(el.options).map((option: any) => ({
      value: option.value,
      text: option.text,
      textLower: option.text.toLowerCase(),
    }))
  );
}

// generate response for each field using the prompt
async function generateAIResponse(fieldInfo: any, options = null) {
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

  // wrap the API call in the retry function
  const response = await retryWithBackoff(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });

  return response;
}

// handle dropdown selection
async function handleDropdown(element: any, value: any, options: any) {
  if (!options || options.length === 0) return;

  try {
    await element.click();
    await delay(1000);

    let bestMatch = options.find(
      (option: any) => option.textLower === value.toLowerCase()
    );

    if (!bestMatch) {
      bestMatch = options.find((option: any) => option.textLower === "no");
    }

    if (!bestMatch) {
      bestMatch = options.find(
        (option: any) =>
          option.textLower.includes(value.toLowerCase()) ||
          value.toLowerCase().includes(option.textLower)
      );
    }

    if (!bestMatch) {
      bestMatch = options[0];
    }

    try {
      await element.select(bestMatch.value);
    } catch {
      try {
        const optionElement = await page.$(
          `option[value="${bestMatch.value}"]`
        );
        if (optionElement) {
          await optionElement.click();
        }
      } catch {
        await element.evaluate((el: any, value: any) => {
          el.value = value;
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, bestMatch.value);
      }
    }

    console.log(`Selected "${bestMatch.text}" for dropdown`);
    await delay(500);
  } catch (error) {
    console.error("Error selecting dropdown option:", error);
  }
}

// handle checkbox/radio inputs
async function handleCheckboxRadio(element: any, value: any) {
  const shouldCheck =
    value.toLowerCase() === "yes" ||
    value.toLowerCase() === "true" ||
    value === "1";
  if (shouldCheck) {
    await element.click();
  }
}

// main function to fill form
async function fillForm(url: string) {
  await setupBrowser(url);
  const formElements = await getFormElements();

  for (const element of formElements) {
    try {
      const label = await getFieldLabel(element);
      const placeholder = await element.evaluate(
        (el: any) => el.placeholder || ""
      );
      const ariaLabel = await element.evaluate(
        (el: any) => el.getAttribute("aria-label") || ""
      );
      const type = await element.evaluate((el: any) => el.type);

      console.log(
        `Processing field: ${
          label || placeholder || ariaLabel || "Unknown field"
        }`
      );

      if (type === "file") {
        await handleFileUpload(element, label || placeholder || ariaLabel);
        continue;
      }

      if (type === "submit") continue;

      if (type === "select-one") {
        const options = await getSelectOptions(element);
        const valueToFill = await generateAIResponse(
          `Label: ${label}\nPlaceholder: ${placeholder}\nAria Label: ${ariaLabel}`,
          options
        );
        await handleDropdown(element, valueToFill, options);
      } else if (type === "checkbox" || type === "radio") {
        const valueToFill = await generateAIResponse(
          `Label: ${label}\nPlaceholder: ${placeholder}\nAria Label: ${ariaLabel}`
        );
        await handleCheckboxRadio(element, valueToFill);
      } else {
        const valueToFill = await generateAIResponse(
          `Label: ${label}\nPlaceholder: ${placeholder}\nAria Label: ${ariaLabel}`
        );
        await element.evaluate((el: any) => (el.value = ""));
        await element.type(valueToFill);
      }

      await delay(500); // use delay helper
    } catch (error) {
      console.error("Error processing field:", error);
      continue;
    }
  }

  console.log("Form filled! Please review before submitting.");
}

// run the function
export { fillForm };
