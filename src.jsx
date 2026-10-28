import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {initialState,advance,disrupt,describe,GROWTH_STEPS,OUTAGE_STEPS,TOTAL_STEPS} from './story-model.js';
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
  const [readySignal,setReadySignal]=useState(null);
  const layoutRef=useRef(null),controlRef=useRef(null),disruptRef=useRef(null);
  const sector=getSector(sectorId);
  const view=sectorServices(describe(state),sector),outage=state.outageAge!==null;
  const finished=outage?view.complete:state.step>0&&view.mature&&state.ai===ai;
  const canDisrupt=!outage&&state.step>0&&!running&&state.ai>0;
  useLayoutEffect(()=>{
    if(!canDisrupt){setReadySignal(null);return;}
    const updateSignal=()=>{
      const layout=layoutRef.current?.getBoundingClientRect(),control=controlRef.current?.getBoundingClientRect(),button=disruptRef.current?.getBoundingClientRect();
      if(!layout||!control||!button)return;
      const gap=parseFloat(getComputedStyle(layoutRef.current).columnGap)||20;
      const x=control.left-layout.left-gap/2;
      const endX=button.left-layout.left+2;
      const endY=button.top-layout.top+button.height/2;
      const startY=Math.max(80,Math.min(endY-80,layout.height*.28));
      setReadySignal({width:layout.width,height:layout.height,path:`M${x} ${startY} V${endY} H${endX}`,endX,endY});
    };
    updateSignal();
    const observer=new ResizeObserver(updateSignal);
    [layoutRef.current,controlRef.current,disruptRef.current].forEach(element=>element&&observer.observe(element));
    window.addEventListener('resize',updateSignal);
    return ()=>{observer.disconnect();window.removeEventListener('resize',updateSignal);};
  },[canDisrupt,outageLoss,sectorId]);
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
  const outageProgress=outage?Math.min(100,state.outageAge/OUTAGE_STEPS*100):0;
  const simulationProgress=outage?outageProgress:growthProgress;
  const stepsRemaining=outage?Math.max(0,OUTAGE_STEPS-state.outageAge):Math.max(0,GROWTH_STEPS-Math.min(state.step,GROWTH_STEPS));
  const progressLabel=finished&&!outage?'Kasvufaas lõpetatud':running?`Paus · ${stepsRemaining} sammu jäänud`:state.step>0&&!finished?`Jätka · ${stepsRemaining} sammu jäänud`:state.crossSector?'Kasvata ühiskonda':'Kasvata organisatsiooni';
  const outageText=state.outageLoss>=.99?'AI tugi kaob':`${Math.round(state.outageLoss*100)}% AI toest kaob`;
  const failureText=state.outageLoss>=.99?sector.failure:sector.failure.replaceAll('AI kaob','AI tugi väheneb').replaceAll('AI-ta','väiksema AI-toega');
  const balanceDelta=Math.round(view.capacity-view.promised);
  const balanceComparison=view.shortfall>1?{tone:'deficit',value:`−${Math.round(view.shortfall)}`,label:'puudu'}:balanceDelta>1?{tone:'surplus',value:`+${balanceDelta}`,label:'varu'}:{tone:'balanced',value:'0',label:'tasakaal'};
  const message=outage?view.complete?failureText:state.outageAge<2?`${outageText}. ${sector.staff} ja ${sector.automation.toLocaleLowerCase('et')} kaotavad esimesena töövõimet.`:sector.waiting+' Töö kuhjub ja uued tegevused aeglustuvad või seiskuvad.':view.mature&&state.step>0?(sector.ready||`${sector.org} on kasvanud AI võimekuse ümber. Katkesta AI tugi: kas kõik lubadused ja võetud kohustused on endiselt täidetavad?`):state.step>0?sector.growth:`Käivita kasv. Vaata, kuidas AI lisavõimekusest saavad uued kohustused. ${sector.waiting}`;
  return <main className={`${running?'running':'paused'} ${canDisrupt?'growth-ready':''}`} data-step={state.step}>
    <header className="hero-intro"><div className="header-copy"><div className="hero-top"><div className="simulation-label"><i/>Interaktiivne simulatsioon <span>AI-sõltuvuse kujunemine</span></div><div className="hero-question"><span>Põhiküsimus</span><p>{sectorQuestion}</p></div></div><div className="hero-main"><div className="hero-title"><h1><em>AI-võimestatud töötaja</em> ja organisatsiooni <strong className="continuity-focus">toimepidevus</strong></h1><div className="sector-context"><span className="sector-context-label">Vali näidisasutus</span><div className="hero-sector-select-wrap"><select id="sector" className="hero-sector-select" aria-label="Näidisasutus" value={sectorId} onChange={e=>{changeSector(e.target.value);e.currentTarget.blur();}}>{SORTED_SECTORS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><span className="hero-sector-action" aria-hidden="true">Muuda<svg className="hero-sector-chevron" viewBox="0 0 20 20"><path d="m5 7 5 5 5-5"/></svg></span></div><span className="sector-context-description">{sectorContext}</span></div></div></div></div></header>
    <section className="main-layout" ref={layoutRef}>
      {canDisrupt&&readySignal&&<div className="growth-ready-signal" aria-hidden="true">
        <svg viewBox={`0 0 ${readySignal.width} ${readySignal.height}`} preserveAspectRatio="none">
          <defs><marker id="ready-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 10 5 0 10Z"/></marker></defs>
          <path className="ready-signal-rail" d={readySignal.path}/>
          <path className="ready-signal-flow" d={readySignal.path} markerEnd="url(#ready-arrow)"/>
          <circle className="ready-signal-pulse pulse-one" cx={readySignal.endX} cy={readySignal.endY} r="13"/><circle className="ready-signal-pulse pulse-two" cx={readySignal.endX} cy={readySignal.endY} r="13"/>
        </svg>
      </div>}
      <div className="simulation">
        <div className="story-steps" aria-label="Simulatsiooni etapid">
          {[
            {eyebrow:'Baastase',text:'Senine töö saab tehtud',tone:'baseline'},
            {eyebrow:'Kasv',text:'AI toel võetakse rohkem tööd',tone:'growth'},
            {eyebrow:'Katkestus',text:'AI kaob, kohustused jäävad',tone:'disruption'}
          ].map((step,i)=><React.Fragment key={step.text}>
            <div className={`story-step tone-${step.tone} ${phase===i?'current':phase>i?'completed':'upcoming'}`} aria-current={phase===i?'step':undefined}>
              <span className="step-number">{i+1}</span>
              <div className="step-copy"><div className="step-heading"><strong>{step.eyebrow}</strong><b className="step-state">{phase===i?'Aktiivne':phase>i?'Läbitud':'Ootel'}</b></div><div className="step-description">{step.text}</div></div>
            </div>
            {i<2&&<div className={`step-connector ${i===0?'to-growth':'to-disruption'} ${phase>i?'active':''}`} aria-hidden="true"><span/></div>}
          </React.Fragment>)}
        </div>
        <div className={`balance ${view.shortfall>1?'has-shortfall':''}`}>
          <div className={`balance-metric ${outage?'loss':''}`}><span>Suudame teha</span><strong data-testid="capacity">{Math.round(view.capacity)}<small>ühikut tööd</small></strong><div className="capacity-bar"><span style={{width:`${view.capacity/340*100}%`}}/></div></div>
          <div className={`balance-comparison ${balanceComparison.tone}`} data-testid="balance-comparison" aria-label={`${balanceComparison.value} ${balanceComparison.label}`}><strong>{balanceComparison.value}</strong><small>{balanceComparison.label}</small></div>
          <div className="balance-metric promises"><span>Oleme lubanud ja kohustunud tegema</span><strong data-testid="promised">{Math.round(view.promised)}<small>ühikut tööd</small></strong><div className="capacity-bar"><span style={{width:`${view.promised/340*100}%`}}/></div></div>
          {view.shortfall>1&&<div className="balance-note danger" role="alert" aria-live="polite"><small>Võimekuse puudujääk</small><div><strong>{Math.round(view.shortfall)}</strong><span>ühiku jagu töövõimet on puudu</span></div></div>}
        </div>
        <StoryScene state={state} view={view} sector={sector}/>
      </div>
      <div className="control-column" ref={controlRef}>
        <aside>
        <div className="controls-title"><span>{outage?'AI-toe katkestuse mõju':'Simulatsiooni juhtimine'}</span><b className="step-counter">Samm {Math.min(state.step,TOTAL_STEPS)} / {TOTAL_STEPS}</b></div>
        {!outage&&<>
        <div className="control-phase-title growth-phase"><span>1</span><strong>Kasvata organisatsiooni AI toel</strong></div>
        <label className="ai-label" htmlFor="ai">AI-võimenduse tase <strong>{ai}%</strong></label>
        <input id="ai" aria-label="AI-võimenduse tase" type="range" min="0" max="100" step="5" value={ai} disabled={running||outage} onChange={e=>setAI(Number(e.target.value))} style={{'--range':`${ai}%`}}/>
        <div className="range-ends"><span>AI tugi puudub</span><span>Maksimaalne võimendus</span></div>
        </>}
        {(!outage||!view.complete)&&<button className={`grow progress-button ${running?'is-running':'is-paused'}`} data-testid="progress-button" style={{'--progress':`${simulationProgress}%`}} disabled={finished} onClick={()=>setRunning(!running)}><span>{progressLabel}</span></button>}
        {state.step>0&&!(finished&&!outage)&&<div className={`run-status ${running?'is-running':'is-paused'}`} role="status">{finished?'Katkestuse mõju on nähtav':running?outage?'Katkestuse mõju levib…':'Vajuta „Paus“, kui soovid AI tuge vähendada.':outage?'Simulatsioon on pausil':'Simulatsioon on pausil. AI tuge saab nüüd vähendada.'}</div>}
        {!outage&&<div className={`outage-action ${canDisrupt?'is-ready':'is-locked'}`} aria-disabled={!canDisrupt}>
          <div className="control-phase-title outage-phase"><span>2</span><strong>Katkesta AI tugi</strong></div>
          <label className="outage-slider-label" htmlFor="outage-loss"><span>AI-toe katkestuse ulatus</span><strong>{Math.round(outageLoss*100)}%</strong></label>
          <input id="outage-loss" className="outage-range" aria-label="AI-toe katkestuse ulatus" type="range" min="0" max="100" step="10" value={Math.round(outageLoss*100)} disabled={!canDisrupt} onChange={e=>setOutageLoss(Number(e.target.value)/100)} style={{'--range':`${outageLoss*100}%`}}/>
          <div className="range-ends outage-ends"><span>AI tugi säilib</span><span>AI tugi kaob täielikult</span></div>
          {!canDisrupt&&<div className="outage-locked-note">{running?'Vajuta „Paus“, et AI tuge vähendada':'Käivita kasv ja peata simulatsioon'}</div>}
          {canDisrupt&&<div className="disruption-cue" role="status"><span aria-hidden="true">↓</span><div><strong>AI-toe vähendamine on nüüd võimalik</strong><small>Vali katkestuse ulatus ja vaata, kas lubatud ning kohustuseks võetud töömaht jääb täidetavaks.</small></div></div>}
          <button className="disrupt" ref={disruptRef} onClick={cutAI} disabled={!canDisrupt||outageLoss===0}>{outageLoss===1?'Katkesta AI tugi täielikult':outageLoss===0?'Vali AI-toe katkestuse ulatus':'Vähenda AI tuge'}</button>
          <div className="disruption-reasons"><strong>Miks võib AI tugi väheneda?</strong><ul><li>tehniline rike</li><li>küberrünnak</li><li>geopoliitiline konflikt või sanktsioonid</li><li>tarneahela häired</li><li>teenusepakkuja või tema päritoluriigi otsused</li><li>hübriid- või otsene sõjaline rünnak</li></ul></div>
        </div>}
        {outage&&<div className="outcome" aria-live="polite"><h2>Mis muutus?</h2><div><span>Enne AI-d</span><strong>100</strong></div><div><span>AI toel</span><strong>{Math.round(view.peak)}</strong></div><div className="after"><span>Pärast katkestust</span><strong>{Math.round(view.capacity)}</strong></div>{view.complete&&<p><b>{view.stopped} {sector.stoppedNoun} seiskus.</b> {state.outageLoss>=.99?`Senise töö jaoks jäi alles ${Math.round(view.manual)}% algsest võimekusest.`:`Alles jäi ${Math.round(view.capacity)} tööühikut, kuid lubatud ja kohustuseks võetud ${Math.round(view.promised)} tööühikut enam täita ei suudeta.`}</p>}</div>}
        <button className="reset" onClick={()=>reset()} aria-label="Alusta uuesti">Alusta uuesti</button>
        </aside>
      </div>
      <section className={`simulation-insight-card ${outage?'warning':''}`} aria-label="Simulatsiooni muutus ajas ja järeldus">
        <div className="scene-caption">{outage?<><b>Lubadused ja võetud kohustused ei kao koos AI-ga.</b> {sector.waiting}</>:state.adaptation>.1?<><b>{state.crossSector?'AI loob põhiteenuste peale uue ühise juhtimiskihi.':'Lisavõimekus muutub uueks töömahuks.'}</b> {sector.org} eeldab, et AI tugi jääb alles.</>:<><b>Alguses on võimekus ning lubatud ja kohustuseks võetud töö tasakaalus.</b> {sector.org} täidab oma seniseid kohustusi.</>}</div>
        <div className="simulation-footer">
          <CapacityChart history={history}/>
          <div className={`takeaway ${outage?'warning':''}`} aria-live="polite"><span>{phase+1}</span><p>{message}</p></div>
        </div>
      </section>
    </section>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
