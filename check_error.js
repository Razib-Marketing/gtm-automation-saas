import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log('[PAGEERROR]', error.message);
  });
  
  console.log("Navigating to localhost...");
  await page.goto('http://localhost:5174/dashboard?auth=success', { waitUntil: 'networkidle0' });
  
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("Body length:", html.length);
  
  const reactError = await page.evaluate(() => {
    const errOverlay = document.querySelector('vite-error-overlay');
    return errOverlay ? errOverlay.shadowRoot.innerHTML : null;
  });
  if (reactError) {
    console.log("Vite Error Overlay:", reactError.substring(0, 500));
  }
  
  await browser.close();
})();
