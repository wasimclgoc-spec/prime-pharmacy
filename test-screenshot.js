const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  for (const [name, url] of [
    ['home', 'http://localhost:3001/home'],
    ['login', 'http://localhost:3001/login'],
    ['assistant', 'http://localhost:3001/assistant'],
    ['upload', 'http://localhost:3001/upload'],
    ['orders', 'http://localhost:3001/orders'],
    ['profile', 'http://localhost:3001/profile'],
    ['admin-login', 'http://localhost:3001/admin/login'],
    ['admin-dashboard', 'http://localhost:3001/admin'],
    ['admin-inventory', 'http://localhost:3001/admin/inventory'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.screenshot({ path: `/app/prime-pharmacy/screenshots/${name}.png`, fullPage: false });
      console.log(`✅ ${name}`);
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
    }
    await page.close();
  }
  
  // Mobile home
  const mPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mPage.goto('http://localhost:3001/home', { waitUntil: 'networkidle', timeout: 15000 });
  await mPage.screenshot({ path: '/app/prime-pharmacy/screenshots/home-mobile.png' });
  console.log('✅ home-mobile');
  
  await browser.close();
})();
