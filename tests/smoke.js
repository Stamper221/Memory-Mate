const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const filePath = `file://${path.resolve(__dirname, '..', 'm.html')}`;
  const taskTitle = 'Automated Smoke Task';

  await page.goto(filePath, { waitUntil: 'load' });
  await page.waitForSelector('#app');
  await page.evaluate(() => {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  });

  await page.click('#add-task-nav');
  await page.waitForSelector('#task-modal.active', { timeout: 2000 });

  await page.focus('#task-title');
  await page.keyboard.type(taskTitle);
  await page.focus('#task-description');
  await page.keyboard.type('Smoke test description');

  const today = new Date().toISOString().split('T')[0];
  await page.$eval('#task-date', (el, value) => { el.value = value; }, today);
  await page.$eval('#task-time', (el) => { el.value = '12:00'; });

  const firstCategory = await page.$eval('#task-category option', (opt) => opt.value);
  if (firstCategory) {
    await page.select('#task-category', firstCategory);
  }
  await page.select('#task-priority', 'high');

  await page.click('#task-save');
  await page.waitForSelector('#task-modal.active', { hidden: true });

  await page.waitForFunction((title) => {
    return Array.from(document.querySelectorAll('.task-card .task-title')).some((el) =>
      el.textContent.includes(title)
    );
  }, {}, taskTitle);

  await page.evaluate((title) => {
    const card = Array.from(document.querySelectorAll('.task-card')).find((node) =>
      node.querySelector('.task-title')?.textContent.includes(title)
    );
    const action = card?.querySelector('.task-quick-action');
    action?.click();
  }, taskTitle);

  await new Promise((resolve) => setTimeout(resolve, 500));
  await page.click('nav button[data-view="completed-view"]');
  await page.waitForSelector('#completed-view.active');
  await page.waitForFunction((title) => {
    return Array.from(document.querySelectorAll('#completed-list .task-title')).some((el) =>
      el.textContent.includes(title)
    );
  }, {}, taskTitle);

  await browser.close();
  console.log('Smoke test completed successfully.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
