const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForTimeout(300);

  // 0 · OVERVIEW
  await page.fill('#fName', 'Alejandra R.');
  await page.evaluate(() => { const e = document.querySelector('#dOverall'); e.value = 72; e.dispatchEvent(new Event('input')); });
  await page.click('[data-group="goal"] .spec[data-value="Students"]');
  await page.click('[data-group="goal"] .spec[data-value="An online audience"]');
  await page.click('[data-group="goal"] .spec[data-value="Other"]');
  await page.fill('#fGoalOther', 'My kids');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shot-0-overview.png', fullPage: true });

  // 1 · AESTHETICS
  await page.click('#nextBtn');
  await page.evaluate(() => { const e = document.querySelector('#dAesthetics'); e.value = 64; e.dispatchEvent(new Event('input')); });
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.querySelector(id); e.value = v; e.dispatchEvent(new Event('input')); };
    set('#col-background', '#fff7ec'); set('#col-dominant', '#1b2a4a');
    set('#col-accent', '#ef6f4d'); set('#col-other1', '#12a37a');
  });
  await page.click('[data-group="fills"] .spec[data-value="Simple fills"]');
  await page.click('[data-group="titles"] .spec[data-value="Titles a different color"]');
  await page.click('[data-group="case"] .spec[data-value="lower-case"]');
  await page.click('[data-group="family"] .spec[data-value="Sans-serif"]');
  await page.click('[data-group="source"] .spec[data-value="Traced over type"]');
  await page.click('[data-group="surface"] .spec[data-value="Textured"]');
  await page.click('[data-group="tool"] .choice[data-value="Other"]');
  await page.fill('#fToolOther', 'Paper app');
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'shot-1-aesthetics.png', fullPage: true });

  // 2 · VOICE
  await page.click('#nextBtn');
  await page.evaluate(() => { const e = document.querySelector('#dVoice'); e.value = 78; e.dispatchEvent(new Event('input')); });
  await page.fill('#fAuthors', 'Anne Lamott: warm, self-deprecating, lets you off the hook');
  await page.click('[data-group="formality"] .choice[data-value="Casual"]');
  await page.click('[data-group="worldview"] .choice[data-value="Romantic"]');
  await page.click('[data-group="delivery"] .choice[data-value="Reassuring"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shot-2-voice.png', fullPage: true });

  // 3 · AVATAR
  await page.click('#nextBtn');
  await page.evaluate(() => { const e = document.querySelector('#dAvatar'); e.value = 40; e.dispatchEvent(new Event('input')); });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#fff"/><circle cx="150" cy="110" r="60" fill="none" stroke="#0E1626" stroke-width="8"/><line x1="150" y1="170" x2="150" y2="235" stroke="#0E1626" stroke-width="8"/><line x1="150" y1="195" x2="105" y2="215" stroke="#0E1626" stroke-width="8"/><line x1="150" y1="195" x2="195" y2="215" stroke="#0E1626" stroke-width="8"/><line x1="150" y1="235" x2="115" y2="275" stroke="#0E1626" stroke-width="8"/><line x1="150" y1="235" x2="185" y2="275" stroke="#0E1626" stroke-width="8"/><line x1="150" y1="50" x2="150" y2="25" stroke="#E15A3C" stroke-width="6"/><circle cx="150" cy="20" r="8" fill="#E15A3C"/></svg>`;
  const png = await page.evaluate(async (s) => new Promise(res => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = 300; c.height = 300; c.getContext('2d').drawImage(img, 0, 0); res(c.toDataURL('image/png')); };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
  }), svg);
  fs.writeFileSync('/tmp/avatar.png', Buffer.from(png.split(',')[1], 'base64'));
  await page.setInputFiles('#fileInput', '/tmp/avatar.png');
  await page.click('[data-group="avatarKind"] .choice[data-value="Human"]');
  await page.fill('#fAvatarNote', 'antenna on top, always mid-stride');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shot-3-avatar.png', fullPage: true });

  // 4 · CARD
  await page.click('#nextBtn');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.CAI.paintCard());
  await page.waitForTimeout(200);
  const dataUrl = await page.evaluate(() => document.querySelector('#cardCanvas').toDataURL('image/png'));
  fs.writeFileSync('preview.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('--- BRIEF ---\n' + await page.textContent('#briefText'));

  // FLAT MODE
  await page.click('#viewToggle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shot-flat.png', fullPage: true });
  const visible = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.screen')).filter(s => s.offsetParent !== null).length);
  console.log('--- FLAT MODE: ' + visible + '/5 sections visible ---');

  console.log('--- ERRORS ---\n' + (errors.length ? errors.join('\n') : 'none'));
  await browser.close();
})();
