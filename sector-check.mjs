import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {SECTORS} from './sectors.js';
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install({time:new Date('2026-10-27T10:00:00Z')});
await page.clock.pauseAt(new Date('2026-10-27T10:00:01Z'));
await page.goto('http://127.0.0.1:5332');
await page.locator('#ai').fill('100');
for(const sector of SECTORS){
  await page.getByLabel('Valdkond').selectOption(sector.id);
  assert.equal(await page.locator('main').getAttribute('data-step'),'0');
  assert.equal(await page.locator('.service').count(),sector.services.length);
  assert.equal(await page.locator('.existing-service').count(),2);
  assert.equal(await page.locator('.added-service').count(),sector.services.length-2);
  assert.equal(await page.locator('.base-service').count(),2);
  assert.equal(await page.locator('.new-service').count(),sector.services.length-2);
  const subtitleParts=sector.subtitle.match(/^(.+?\.)\s+(.+)$/);
  const headerText=await page.locator('header').innerText();
  assert.ok(headerText.includes(subtitleParts?.[1]||sector.subtitle));
  if(subtitleParts?.[2])assert.ok(headerText.includes(subtitleParts[2]));
  assert.ok(await page.locator('.workforce').innerText().then(text=>text.includes(sector.staff)));
  await page.getByRole('button',{name:sector.id==='cross-sector'?'Kasvata ühiskonda':'Kasvata organisatsiooni'}).click();
  await page.clock.runFor(12000);
  assert.equal(await page.locator('.service.active').count(),sector.services.length);
  await page.getByLabel('AI-toe katkestuse ulatus').fill('100');
  await page.getByRole('button',{name:'Katkesta AI tugi täielikult'}).click();
  if(sector.id==='cross-sector'){
    await page.clock.runFor(6000);assert.equal(await page.locator('.service.stopped').count(),1);
    await page.clock.runFor(1000);assert.equal(await page.locator('.service.stopped').count(),2);
    await page.clock.runFor(3000);assert.equal(await page.locator('.service.stopped').count(),5);
  }else await page.clock.runFor(10000);
  assert.ok(await page.locator('.takeaway').innerText().then(text=>text.includes(sector.failure)));
  for(let i=0;i<sector.services.length;i++){
    assert.ok(await page.locator('.service').nth(i).innerText().then(text=>text.includes(i<2?sector.services[i].delayed:sector.services[i].stopped)));
  }
  const scene=await page.locator('.scene-content').boundingBox();
  const last=await page.locator('.service').last().boundingBox();
  const caption=await page.locator('.scene-caption').boundingBox();
  assert.ok(last.y+last.height<=scene.y+scene.height+1,`${sector.id}: service cards must stay inside the scene`);
  assert.ok(!caption||last.y+last.height<=caption.y+1,`${sector.id}: service cards must never overlap the caption`);
}
await page.screenshot({path:'sector-cross-desktop.png'});
await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:'sector-cross-projector.png'});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'sector-cross-mobile.png',fullPage:true});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.getByRole('button',{name:'Alusta uuesti'}).click();
await page.getByRole('button',{name:'Kasvata ühiskonda'}).click();
await page.clock.runFor(3000);
await page.getByLabel('Valdkond').selectOption('it');
await page.clock.runFor(2000);assert.equal(await page.locator('main').getAttribute('data-step'),'0');
assert.deepEqual(errors,[]);await browser.close();
console.log('PASS: nine sector stories, reset on change, customized failures, seven-layer cascade, desktop/projector/mobile.');
