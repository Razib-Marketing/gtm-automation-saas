import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('https://gtm-automation-saas.pages.dev/dashboard?auth=success', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: '/Users/mdatiarrahmanovi/.gemini/antigravity/brain/5118188d-7898-4474-a0a4-03c54e84b77c/scratch/screenshot.png' });
  
  await browser.close();
})();
