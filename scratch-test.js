import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  console.log('Navigating to http://localhost:3050/manager...');
  await page.goto('http://localhost:3050/manager', { waitUntil: 'networkidle0' });

  console.log('Waiting for tasks to render...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Attempting to find a task element...');
  // Find task card (either Kanban or SprintBoard TaskCard)
  // Usually they have some text like #T- or class names
  const taskElements = await page.$$('div'); // Need a specific selector
  
  // Let's just run a script in the browser to find elements with onClick or specific classes
  await page.evaluate(() => {
    // try to find any text containing #T-
    const elements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('#T-') && el.tagName === 'DIV'
    );
    if (elements.length > 0) {
      console.log('Found elements with #T-, clicking the first one. Classes: ', elements[0].className);
      elements[0].click();
    } else {
      console.log('No elements with #T- found. Clicking the first element that looks like a task.');
      // find elements containing 'DONE' or 'IN_PROGRESS'
      const statusEls = Array.from(document.querySelectorAll('div')).filter(el => 
        el.className.includes('bg-white') && el.className.includes('border') && el.className.includes('rounded')
      );
      if (statusEls.length > 10) {
          statusEls[10].click();
          console.log('Clicked a random card-like element:', statusEls[10].className);
      }
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Extracting DOM...');
  const dom = await page.evaluate(() => document.body.innerHTML);
  if (dom.includes('TaskDetailModal') || dom.includes('Status') || dom.includes('Assignee')) {
      console.log('SUCCESS: Modal text found in DOM!');
  } else {
      console.log('FAILED: Modal text NOT found in DOM!');
  }

  await browser.close();
  console.log('Done.');
})();
