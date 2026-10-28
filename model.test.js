import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,advance,disrupt,describe,GROWTH_STEPS,OUTAGE_STEPS,TOTAL_STEPS} from './story-model.js';
import {SECTORS,sectorServices} from './sectors.js';
function grown(ai=100){let state=initialState();for(let i=0;i<GROWTH_STEPS;i++)state=advance(state,ai);return state;}
test('baseline work is balanced without AI',()=>{
  const view=describe(initialState());
  assert.equal(view.capacity,100);assert.equal(view.promised,100);
  assert.equal(view.services.filter(s=>s.active).length,2);
  assert.deepEqual(disrupt(initialState()),initialState());
});
test('AI capacity precedes new promises and services',()=>{
  const first=describe(advance(initialState(),100));
  assert.ok(first.capacity>100);assert.equal(first.promised,100);
  const view=describe(grown());
  assert.equal(grown().step,GROWTH_STEPS);
  assert.equal(view.capacity,310);assert.equal(view.promised,280);
  assert.equal(view.services.filter(s=>s.active).length,5);
  assert.ok(view.services.every(s=>s.status==='working'));
});
test('outage reaches workers before services; promises remain',()=>{
  let state=advance(disrupt(grown()),100);
  const early=describe(state);assert.ok(early.capacity<310);
  assert.ok(early.services.every(s=>s.status==='working'));
  for(let i=1;i<OUTAGE_STEPS;i++)state=advance(state,100);
  const view=describe(state);
  assert.equal(state.step,TOTAL_STEPS);
  assert.equal(view.capacity,78);assert.equal(view.promised,280);
  assert.equal(view.shortfall,202);assert.equal(view.stopped,3);
  assert.ok(view.services.slice(0,2).every(s=>s.status==='delayed'));
  assert.ok(view.services.reduce((sum,s)=>sum+s.delivered,0)<=view.capacity);
});
test('a 50% AI outage leaves more capacity but commitments still exceed it',()=>{
  let state=disrupt(grown(),.5);
  for(let i=0;i<OUTAGE_STEPS;i++)state=advance(state,100);
  const view=describe(state);
  assert.equal(view.capacity,194);assert.equal(view.promised,280);
  assert.equal(view.shortfall,86);assert.ok(view.stopped<3);
});
test('lowering AI does not remove commitments or unlearn adaptation',()=>{
  const state=grown(),lowered=advance(state,25);
  assert.equal(describe(lowered).promised,describe(state).promised);
  assert.ok(describe(lowered).capacity<describe(state).capacity);
});
test('all sectors provide complete names, promises and failure descriptions',()=>{
  assert.equal(new Set(SECTORS.map(s=>s.id)).size,12);
  for(const sector of SECTORS){
    const view=sectorServices(describe(initialState(sector.id==='cross-sector')),sector);
    assert.equal(view.services.length,sector.id==='cross-sector'?7:5);
    view.services.forEach(service=>['name','promise','delayed','stopped'].forEach(key=>assert.ok(service[key]?.length>0)));
  }
});
test('doctoral researcher focus covers the actual research, teaching and collaboration workload',()=>{
  const focus=SECTORS.find(sector=>sector.id==='uti-doctoral-researcher');
  assert.ok(focus.label.includes('Nooremteadur'));
  assert.equal(focus.individual,true);
  assert.equal(focus.automation,'Digitoega uurimistöövoog');
  assert.ok(focus.subtitle.includes('ekspertiis')&&focus.subtitle.includes('süsteemide kontroll'));
  for(const activity of ['teadusartiklid','ainearendus','empiiriline analüüs','Konverentsid','Digitaalse suveräänsuse']){
    assert.ok(focus.services.some(service=>service.name.includes(activity)),`missing doctoral activity: ${activity}`);
  }
  assert.ok(focus.failure.includes('artiklite')&&focus.failure.includes('õppetöö')&&focus.failure.includes('konverentsiettekannete'));
});
test('social sciences institute focus reflects its curricula, research clusters and external role',()=>{
  const focus=SECTORS.find(sector=>sector.id==='tartu-social-sciences');
  for(const cluster of ['ajakirjanduse ja kommunikatsiooni','sotsioloogia ja sotsiaalse heaolu','infoteaduste'])assert.ok(focus.subtitle.includes(cluster));
  for(const activity of ['Kümne õppekava','Kolme teemaklastri','Isikustatud õpi-','Teemaklastreid ühendav','ekspertiis ja partneritugi']){
    assert.ok(focus.services.some(service=>service.name.includes(activity)),`missing institute activity: ${activity}`);
  }
  assert.ok(focus.waiting.includes('Õppijad')&&focus.waiting.includes('uurimisrühmad')&&focus.waiting.includes('meedia'));
});
test('cross-sector failure advances one supplier layer per step',()=>{
  let state=initialState(true);
  for(let i=0;i<GROWTH_STEPS;i++)state=advance(state,100);
  assert.equal(Math.round(describe(state).promised),280);
  state=disrupt(state);
  for(let age=1;age<=OUTAGE_STEPS;age++){
    state=advance(state,100);
    const view=describe(state);
    assert.equal(view.stopped,Math.max(0,age-5));
    assert.equal(view.complete,age===OUTAGE_STEPS);
    assert.equal(Math.round(view.promised),280);
  }
  assert.equal(describe(state).capacity,78);
  assert.equal(state.step,TOTAL_STEPS);
  assert.equal(describe(state).services.at(-1).status,'stopped');
});
