// @ts-nocheck
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const LOCALES_DIR = path.join(__dirname, 'src', 'i18n', 'locales');
const EN_FILE_PATH = path.join(LOCALES_DIR, 'en.ts');
const AR_FILE_PATH = path.join(LOCALES_DIR, 'ar.ts');

// Regex source — re-instantiated per file to avoid stale lastIndex
const T_FUNCTION_REGEX_SOURCE = /\bt\(\s*(['"])(.+?)\1\s*\)/g;

/**
 * Translates text using a shared Puppeteer page instance.
 * Note: Google classes (.ryNqvb) change periodically.
 */
async function translateText(page, fromLang, toLang, text) {
  try {
    const url = `https://translate.google.com/?sl=${fromLang}&tl=${toLang}&text=${encodeURIComponent(text)}&op=translate`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const selector = '.ryNqvb';
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
    } catch {
      console.warn(`⚠️  Timeout waiting for translation: "${text}"`);
      return `__TODO_${text}__`;
    }

    const translatedText = await page.$eval(selector, (el) => el.textContent);

    console.log(`   ✓ Translated: "${text}" -> "${translatedText}"`);
    return translatedText;
  } catch (error) {
    console.error(`❌ Failed to translate "${text}":`, error?.message ?? error);
    return `__TODO_${text}__`;
  }
}

/**
 * Recursively walk through a directory and return all .tsx and .ts file paths.
 */
function getTsxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Extract all t('...') keys from source files.
 */
function extractKeys(files) {
  const keys = new Set();

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // New regex instance per file to ensure lastIndex starts at 0
    const regex = new RegExp(
      T_FUNCTION_REGEX_SOURCE.source,
      T_FUNCTION_REGEX_SOURCE.flags,
    );
    let match = regex.exec(content);
    while (match !== null) {
      keys.add(match[2]);
      match = regex.exec(content);
    }
  }

  return Array.from(keys).sort();
}

/**
 * Read existing translations from a TS locale file.
 * Handles escaped single quotes inside keys and values.
 */
function readExistingTranslations(filePath) {
  if (!fs.existsSync(filePath)) return {};

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries = {};
    // Matches: 'key': 'value', — supports \' escapes inside both key and value
    const entryRegex =
      /^\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)',?\s*$/gm;
    let m = entryRegex.exec(content);
    while (m !== null) {
      entries[m[1].replace(/\\'/g, "'")] = m[2].replace(/\\'/g, "'");
      m = entryRegex.exec(content);
    }
    return entries;
  } catch {
    console.warn(`Could not parse existing ${filePath}, starting fresh.`);
  }
  return {};
}

/**
 * Generate file content, skipping keys already present in existingData.
 */
async function generateFileContent(
  keys,
  existingData,
  isArabic = false,
  page = null,
) {
  const lines = ['export default {'];

  for (const key of keys) {
    let value = '';

    if (key in existingData && !existingData[key].startsWith('__TODO_')) {
      // Already translated — reuse as-is, no network call needed
      value = existingData[key];
    } else if (isArabic && page) {
      value = await translateText(page, 'en', 'ar', key);
    } else {
      value = key;
    }

    const safeKey = key.replace(/'/g, "\\'");
    const safeValue = value.replace(/'/g, "\\'");
    lines.push(`  '${safeKey}': '${safeValue}',`);
  }

  lines.push('};\n');
  return lines.join('\n');
}

// --- Main Execution ---

(async () => {
  console.log('🔍 Scanning src folder for translations...');

  const files = getTsxFiles(SRC_DIR);
  console.log(`📂 Found ${files.length} .tsx/.ts files.`);

  const foundKeys = extractKeys(files);
  console.log(`🔑 Found ${foundKeys.length} unique translation keys.`);

  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  const existingEn = readExistingTranslations(EN_FILE_PATH);
  const existingAr = readExistingTranslations(AR_FILE_PATH);

  const newArKeys = foundKeys.filter(
    (k) => !(k in existingAr) || existingAr[k].startsWith('__TODO_'),
  );
  console.log(`🆕 ${newArKeys.length} Arabic key(s) need translation.`);

  let browser = null;
  let page = null;

  if (newArKeys.length > 0) {
    console.log('🌐 Launching Puppeteer for translations...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    page = await browser.newPage();
  } else {
    console.log('✅ All keys already translated, skipping browser.');
  }

  console.log('📝 Generating English file...');
  const newEnContent = await generateFileContent(
    foundKeys,
    existingEn,
    false,
    null,
  );

  console.log('📝 Generating Arabic file...');
  const newArContent = await generateFileContent(
    foundKeys,
    existingAr,
    true,
    page,
  );

  if (browser) await browser.close();

  fs.writeFileSync(EN_FILE_PATH, newEnContent);
  fs.writeFileSync(AR_FILE_PATH, newArContent);

  console.log('✅ Successfully updated:');
  console.log(`   - ${EN_FILE_PATH}`);
  console.log(`   - ${AR_FILE_PATH}`);
})().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
