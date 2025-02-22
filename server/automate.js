require("dotenv").config();
const puppeteer = require("puppeteer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
let browser;
let page;

// valuable user information to fill out forms
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

// file paths configuration
const fileConfig = {
  resume: "resume.pdf",
  coverLetter: "cover-letter.pdf",
};

// helper function for delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// helper function to handle API retries
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
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
async function setupBrowser(url) {
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
async function getFieldLabel(element) {
  try {
    const labelText = await element.evaluate((el) => {
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
async function handleFileUpload(element, label) {
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
async function getSelectOptions(element) {
  return await element.evaluate((el) =>
    Array.from(el.options).map((option) => ({
      value: option.value,
      text: option.text,
      textLower: option.text.toLowerCase(),
    }))
  );
}

// generate response for each field using the prompt
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

  // wrap the API call in the retry function
  const response = await retryWithBackoff(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });

  return response;
}

// handle dropdown selection
async function handleDropdown(element, value, options) {
  if (!options || options.length === 0) return;

  try {
    await element.click();
    await delay(1000);

    let bestMatch = options.find(
      (option) => option.textLower === value.toLowerCase()
    );

    if (!bestMatch) {
      bestMatch = options.find((option) => option.textLower === "no");
    }

    if (!bestMatch) {
      bestMatch = options.find(
        (option) =>
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
        await element.evaluate((el, value) => {
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
async function handleCheckboxRadio(element, value) {
  const shouldCheck =
    value.toLowerCase() === "yes" ||
    value.toLowerCase() === "true" ||
    value === "1";
  if (shouldCheck) {
    await element.click();
  }
}

// main function to fill form
async function fillForm(url) {
  await setupBrowser(url);
  const formElements = await getFormElements();

  for (const element of formElements) {
    try {
      const label = await getFieldLabel(element);
      const placeholder = await element.evaluate((el) => el.placeholder || "");
      const ariaLabel = await element.evaluate(
        (el) => el.getAttribute("aria-label") || ""
      );
      const type = await element.evaluate((el) => el.type);

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
        await element.evaluate((el) => (el.value = ""));
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

// export function
module.exports = { fillForm };
