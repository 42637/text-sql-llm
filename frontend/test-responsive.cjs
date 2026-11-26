const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { name: 'mobile_360', width: 360, height: 740 },
  { name: 'mobile_375', width: 375, height: 667 },
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'mobile_430', width: 430, height: 932 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'tablet_1024', width: 1024, height: 768 },
  { name: 'laptop_1366', width: 1366, height: 768 },
  { name: 'desktop_1920', width: 1920, height: 1080 },
];

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  console.log('Navigating to http://127.0.0.1:8000 ...');
  await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle0' });

  const title = await page.title();
  console.log(`Page title: "${title}"`);

  // Verify status indicator online
  await page.waitForFunction(() => {
    return document.body.innerText.includes('TextSQL-GPT-v1') &&
           (document.body.innerText.includes('CPU') || document.body.innerText.includes('CUDA'));
  }, { timeout: 10000 });
  console.log('Model status verified online.');

  // Type question
  const textareas = await page.$$('textarea');
  for (const ta of textareas) {
    const placeholder = await (await ta.getProperty('placeholder')).jsonValue();
    if (placeholder.includes('Example:')) {
      await ta.click();
      await ta.type('Show all employees whose salary is greater than 50000.');
      break;
    }
  }

  // Click Generate SQL
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const genBtn = buttons.find(b => b.innerText.includes('Generate SQL'));
    if (genBtn) genBtn.click();
  });

  // Wait for SQL output
  await page.waitForSelector('pre', { timeout: 20000 });
  const codeText = await page.$eval('pre', (el) => el.innerText);
  console.log('Generated SQL Output:\n', codeText);

  // Test Responsive Viewports and Horizontal Overflow Check
  console.log('\n--- TESTING ALL RESPONSIVE VIEWPORTS (ZERO OVERFLOW) ---');
  let allPassed = true;
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise((r) => setTimeout(r, 300));

    const check = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      return {
        scrollWidth,
        innerWidth,
        hasOverflow: scrollWidth > innerWidth || bodyScrollWidth > innerWidth,
      };
    });

    const status = check.hasOverflow ? 'FAILED (Overflow!)' : 'PASSED (Zero Overflow)';
    console.log(`Viewport ${vp.name.padEnd(12)} (${vp.width}x${vp.height}): scrollWidth=${check.scrollWidth}, innerWidth=${check.innerWidth} => ${status}`);
    if (check.hasOverflow) allPassed = false;
  }

  if (!allPassed) {
    throw new Error('Horizontal overflow detected in responsive testing!');
  }

  console.log('\nALL RESPONSIVE AUDIT CHECKS PASSED WITH ZERO OVERFLOW!');
  await browser.close();
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
