const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const LOCALES_DIR = path.join(__dirname, 'src', 'i18n', 'locales');
const EN_FILE_PATH = path.join(LOCALES_DIR, 'en.ts');
const AR_FILE_PATH = path.join(LOCALES_DIR, 'ar.ts');

// Regex to find t('string') or t("string")
const T_FUNCTION_REGEX = /\bt\(\s*(['"])(.+?)\1\s*\)/g;

/**
 * Translates text using a shared Puppeteer page instance.
 * Note: Google classes (.ryNqvb) change periodically.
 */
async function translateText(page, fromLang, toLang, text) {
  try {
    const url = `https://translate.google.com/?sl=${fromLang}&tl=${toLang}&text=${encodeURIComponent(text)}&op=translate`;

    // Don't wait for network idle, domcontentloaded is faster and usually sufficient for the text box
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the result container
    const selector = '.ryNqvb';
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
    } catch (e) {
      console.warn(`⚠️  Timeout waiting for translation: "${text}"`);
      return `__TODO_${text}__`;
    }

    const translatedText = await page.$eval(selector, (el) => el.textContent);

    console.log(`   ✓ Translated: "${text}" -> "${translatedText}"`);
    return translatedText;
  } catch (error) {
    console.error(`❌ Failed to translate "${text}":`, error.message);
    return `__TODO_${text}__`;
  }
}

/**
 * Recursively walk through a directory and return all file paths ending with .tsx
 */
function getTsxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getTsxFiles(filePath, fileList);
    } else {
      if (file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Extract keys from file content using regex
 */
function extractKeys(files) {
  const keys = new Set();

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;

    while ((match = T_FUNCTION_REGEX.exec(content)) !== null) {
      keys.add(match[2]);
    }
  });

  return Array.from(keys).sort();
}

/**
 * Helper to read existing TS file
 */
function readExistingTranslations(filePath) {
  if (!fs.existsSync(filePath)) return {};

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/export default\s*({[\s\S]*?});/);
    if (match && match[1]) {
      const entryRegex = /(['"]?)(.+?)\1\s*:\s*(['"])([\s\S]*?)\3,?/g;
      const entries = {};
      let entryMatch;
      while ((entryMatch = entryRegex.exec(match[1])) !== null) {
        entries[entryMatch[2]] = entryMatch[4];
      }
      return entries;
    }
  } catch (e) {
    console.warn(`Could not parse existing ${filePath}, starting fresh.`);
  }
  return {};
}

/**
 * Generate file content
 * Now accepts the Puppeteer page object
 */
async function generateFileContent(
  keys,
  existingData,
  isArabic = false,
  page = null,
) {
  const lines = ['export default {'];

  // Serial loop is intentional to avoid Google Translate rate limiting
  for (const key of keys) {
    let value;

    if (existingData[key]) {
      value = existingData[key];
    } else {
      if (isArabic && page) {
        // Only translate if it's Arabic and we have a browser page
        value = await translateText(page, 'en', 'ar', key);
      } else {
        value = key;
      }
    }

    const safeValue = value.replace(/'/g, "\\'");

    const safeKey = `'${key}'`;

    lines.push(`  ${safeKey}: '${safeValue}',`);
  }

  lines.push('};\n');
  return lines.join('\n');
}

// --- Main Execution ---

(async () => {
  console.log('🔍 Scanning src folder for translations...');

  const files = getTsxFiles(SRC_DIR);
  console.log(`📂 Found ${files.length} .tsx files.`);

  const foundKeys = extractKeys(files);
  console.log(`🔑 Found ${foundKeys.length} unique translation keys.`);

  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  const existingEn = readExistingTranslations(EN_FILE_PATH);
  const existingAr = readExistingTranslations(AR_FILE_PATH);

  // Launch Browser ONCE
  console.log('🌐 Launching Puppeteer for translations...');
  const browser = await puppeteer.launch({
    headless: 'new', // "new" is the updated headless mode
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  // 1. Generate English (No translation needed)
  console.log('📝 Generating English file...');
  const newEnContent = await generateFileContent(
    foundKeys,
    existingEn,
    false,
    null,
  );

  // 2. Generate Arabic (With translation)
  console.log('📝 Generating Arabic file (this may take time)...');
  const newArContent = await generateFileContent(
    foundKeys,
    existingAr,
    true,
    page,
  );

  await browser.close();

  fs.writeFileSync(EN_FILE_PATH, newEnContent);
  fs.writeFileSync(AR_FILE_PATH, newArContent);

  console.log(`✅ Successfully updated:`);
  console.log(`   - ${EN_FILE_PATH}`);
  console.log(`   - ${AR_FILE_PATH}`);
})().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
