import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {initialState,advance,disrupt,describe} from './story-model.js';
import StoryScene from './StoryScene.jsx';
import CapacityChart from './CapacityChart.jsx';
import {SECTORS,getSector,sectorServices} from './sectors.js';
import './story.css';

const SORTED_SECTORS=[...SECTORS].sort((a,b)=>a.label.localeCompare(b.label,'et'));
const historyPoint=state=>{
  const snapshot=describe(state);
  return {key:`${state.step}-${state.outageAge??'growth'}-${state.ai}-${state.adaptation}`,step:state.step,capacity:snapshot.capacity,promised:snapshot.promised,outage:state.outageAge!==null};
};

function App(){
  const [ai,setAI]=useState(50),[state,setState]=useState(initialState),[running,setRunning]=useState(false);
  const [sectorId,setSectorId]=useState('public'),[outageLoss,setOutageLoss]=useState(.5);
  const [history,setHistory]=useState(()=>[historyPoint(initialState())]);
  const sector=getSector(sectorId);
  const view=sectorServices(describe(state),sector),outage=state.outageAge!==null;
  const finished=outage?view.complete:state.step>0&&view.mature&&state.ai===ai;
  const growthReady=finished&&!outage;
  useEffect(()=>{
    if(!running||finished)return;
    const timer=setInterval(()=>setState(previous=>advance(previous,ai)),1000);
    return()=>clearInterval(timer);
  },[running,finished,ai]);
  useEffect(()=>{if(finished)setRunning(false)},[finished]);
  useEffect(()=>{
    const point=historyPoint(state);
    setHistory(previous=>previous.at(-1)?.key===point.key?previous:[...previous,point]);
  },[state]);
  function reset(){const next=initialState(sectorId==='cross-sector');setRunning(false);setState(next);setHistory([historyPoint(next)]);}
  function changeSector(value){const next=initialState(value==='cross-sector');setSectorId(value);setRunning(false);setState(next);setHistory([historyPoint(next)]);}
  function cutAI(){setState(previous=>disrupt(previous,outageLoss));setRunning(true);}
  const phase=outage?2:state.step>0?1:0;
  const subtitleParts=sector.subtitle.match(/^(.+?\.)\s+(.+)$/);
  const sectorContext=subtitleParts?.[1]||sector.subtitle;
  const sectorQuestion=subtitleParts?.[2]||'Kuidas ühe valdkonna katkestus mõjutab kogu teenustevõrgustikku?';
  const growthTarget=ai/100;
  const growthProgress=growthTarget===0?100:Math.min(100,state.adaptation/growthTarget*100);
  const outageProgress=outage?Math.min(100,state.outageAge/(state.crossSector?10:4)*100):0;
  const simulationProgress=outage?outageProgress:growthProgress;
  const progressRemaining=Math.max(0,Math.ceil(100-simulationProgress));
  const progressLabel=finished&&!outage?'Kasv valmis':running?`Paus · ${progressRemaining}% jäänud`:state.step>0&&!finished?`Jätka · ${progressRemaining}% jäänud`:'Kasvata organisatsiooni';
  const outageText=state.outageLoss>=.99?'AI tugi kaob':`${Math.round(state.outageLoss*100)}% AI toest kaob`;
  const failureText=state.outageLoss>=.99?sector.failure:sector.failure.replaceAll('AI kaob','AI tugi väheneb').replaceAll('AI-ta','väiksema AI-toega');
  const message=outage?view.complete?failureText:state.outageAge<2?`${outageText}. ${sector.staff} ja ${sector.automation.toLocaleLowerCase('et')} kaotavad esimesena töövõimet.`:sector.waiting+' Töö kuhjub ja uued tegevused aeglustuvad või seiskuvad.':view.mature&&state.step>0?`${sector.org} on kasvanud AI võimekuse ümber. Katkesta AI tugi: kas kõik lubadused on endiselt täidetavad?`:state.step>0?sector.growth:`Käivita kasv. Vaata, kuidas AI lisavõimekusest saavad uued kohustused. ${sector.waiting}`;
  return <main className={`${running?'running':'paused'} ${growthReady?'growth-ready':''}`} data-step={state.step}>
    <header className="hero-intro"><div className="header-copy"><div className="hero-top"><div className="simulation-label"><i/>Interaktiivne simulatsioon <span>AI-sõltuvuse kujunemine</span></div><div className="hero-question"><span>Põhiküsimus</span><p>{sectorQuestion}</p></div></div><div className="hero-main"><div className="hero-title"><h1><em>AI-võimestatud töötaja</em> ja organisatsiooni <strong className="continuity-focus">toimepidevus</strong></h1><p>{sectorContext}</p></div></div></div></header>
    <section className="main-layout">
      {growthReady&&<div className="growth-ready-signal" aria-hidden="true">
        <svg viewBox="0 0 1000 800" preserveAspectRatio="none">
          <defs><marker id="ready-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 10 5 0 10Z"/></marker></defs>
          <path className="ready-signal-rail" d="M720 255 V505 H760"/>
          <path className="ready-signal-flow" d="M720 255 V505 H760" markerEnd="url(#ready-arrow)"/>
          <circle className="ready-signal-pulse pulse-one" cx="760" cy="505" r="13"/><circle className="ready-signal-pulse pulse-two" cx="760" cy="505" r="13"/>
        </svg>
      </div>}
      <div className="simulation">
        <div className="story-steps" aria-label="Simulatsiooni etapid">
          {[
            {eyebrow:'Lähtekoht',text:'Senine töö saab tehtud',tone:'baseline'},
            {eyebrow:'Kasv',text:'AI toel võetakse rohkem tööd',tone:'growth'},
            {eyebrow:'Katkestus',text:'AI kaob, kohustused jäävad',tone:'disruption'}
          ].map((step,i)=><React.Fragment key={step.text}>
            <div className={`story-step tone-${step.tone} ${phase===i?'current':phase>i?'completed':'upcoming'}`} aria-current={phase===i?'step':undefined}>
              <span className="step-number">{i+1}</span>
              <span className="step-copy"><small>{step.eyebrow}<b className="step-state">{phase===i?'Aktiivne':phase>i?'Läbitud':'Ootel'}</b></small><strong>{step.text}</strong></span>
            </div>
            {i<2&&<div className={`step-connector ${i===0?'to-growth':'to-disruption'} ${phase>i?'active':''}`} aria-hidden="true"><span/></div>}
          </React.Fragment>)}
        </div>
        <div className={`balance ${view.shortfall>1?'has-shortfall':''}`}>
          <div className={`balance-metric ${outage?'loss':''}`}><span>Suudame teha</span><strong data-testid="capacity">{Math.round(view.capacity)}<small>ühikut tööd</small></strong><div className="capacity-bar"><span style={{width:`${view.capacity/340*100}%`}}/></div></div>
          <div className="balance-sign">{view.shortfall>1?'<':'≥'}</div>
          <div className="balance-metric promises"><span>Oleme lubanud teha</span><strong data-testid="promised">{Math.round(view.promised)}<small>ühikut tööd</small></strong><div className="capacity-bar"><span style={{width:`${view.promised/340*100}%`}}/></div></div>
          {view.shortfall>1&&<div className="balance-note danger" role="alert" aria-live="polite"><small>Võimekuse puudujääk</small><div><strong>{Math.round(view.shortfall)}</strong><span>ühiku jagu töövõimet on puudu</span></div></div>}
        </div>
        <StoryScene state={state} view={view} sector={sector}/>
        <div className="simulation-footer">
          <CapacityChart history={history}/>
          <div className={`takeaway ${outage?'warning':''}`} aria-live="polite"><span>{phase+1}</span><p>{message}</p></div>
        </div>
      </div>
      <div className="control-column">
        <div className="sector-picker"><label htmlFor="sector">Vali valdkond</label><div className="sector-select-wrap"><select id="sector" aria-label="Valdkond" value={sectorId} onChange={e=>changeSector(e.target.value)}>{SORTED_SECTORS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><svg className="sector-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></div></div>
        <aside>
        <div className="controls-title">{outage?'AI-toe katkestuse mõju':'Simulatsiooni juhtimine'}</div>
        {!outage&&<>
        <div className="control-phase-title growth-phase"><span>1</span><strong>Kasvata organisatsiooni AI toel</strong></div>
        <label className="ai-label" htmlFor="ai">AI-võimenduse tase <strong>{ai}%</strong></label>
        <input id="ai" aria-label="AI-võimenduse tase" type="range" min="0" max="100" step="5" value={ai} disabled={running||outage} onChange={e=>setAI(Number(e.target.value))} style={{'--range':`${ai}%`}}/>
        <div className="range-ends"><span>AI tugi puudub</span><span>Maksimaalne võimendus</span></div>
        </>}
        {(!outage||!view.complete)&&<button className={`grow progress-button ${running?'is-running':'is-paused'}`} data-testid="progress-button" style={{'--progress':`${simulationProgress}%`}} disabled={finished} onClick={()=>setRunning(!running)}><span>{progressLabel}</span></button>}
        {state.step>0&&!(finished&&!outage)&&<div className={`run-status ${running?'is-running':'is-paused'}`} role="status">{finished?'Katkestuse mõju on nähtav':running?outage?'Katkestus levib…':'Töövõime ja kohustused kasvavad…':'Simulatsioon on pausil'}</div>}
        {!outage&&<div className="outage-action">
          <div className="control-phase-title outage-phase"><span>2</span><strong>Katkesta AI tugi</strong></div>
          <label className="outage-slider-label" htmlFor="outage-loss"><span>AI-toe katkestuse ulatus</span><strong>{Math.round(outageLoss*100)}%</strong></label>
          <input id="outage-loss" className="outage-range" aria-label="AI-toe katkestuse ulatus" type="range" min="0" max="100" step="10" value={Math.round(outageLoss*100)} disabled={running} onChange={e=>setOutageLoss(Number(e.target.value)/100)} style={{'--range':`${outageLoss*100}%`}}/>
          <div className="range-ends outage-ends"><span>AI tugi säilib</span><span>AI tugi kaob täielikult</span></div>
          {state.step>0&&<div className="disruption-cue" role="status"><span aria-hidden="true">↓</span><div><strong>{finished?'Kasv on valmis — vähenda nüüd AI tuge':'Katseta riski — vähenda AI tuge'}</strong><small>{finished?'Vaata, kas lubatud töömaht jääb täidetavaks.':'Võid toe vähendada juba kasvu ajal või oodata kasvu lõpuni.'}</small></div></div>}
          <button className="disrupt" onClick={cutAI} disabled={state.ai===0||outageLoss===0}>{outageLoss===1?'Katkesta AI tugi täielikult':outageLoss===0?'Vali AI-toe katkestuse ulatus':`Vähenda AI tuge ${Math.round(outageLoss*100)}%`}</button>
        </div>}
        {outage&&<div className="outcome" aria-live="polite"><h2>Mis muutus?</h2><div><span>Enne AI-d</span><strong>100</strong></div><div><span>AI toel</span><strong>{Math.round(view.peak)}</strong></div><div className="after"><span>Pärast katkestust</span><strong>{Math.round(view.capacity)}</strong></div>{view.complete&&<p><b>{view.stopped} {sector.stoppedNoun} seiskus.</b> {state.outageLoss>=.99?`Senise töö jaoks jäi alles ${Math.round(view.manual)}% algsest võimekusest.`:`Alles jäi ${Math.round(view.capacity)} tööühikut, kuid lubatud ${Math.round(view.promised)} tööühikut enam täita ei suudeta.`}</p>}</div>}
        <button className="reset" onClick={()=>reset()} aria-label="Alusta uuesti">Alusta uuesti</button>
        </aside>
      </div>
    </section>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
