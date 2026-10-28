import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {initialState,advance,disrupt,describe,GROWTH_STEPS,OUTAGE_STEPS,TOTAL_STEPS} from './story-model.js';
import StoryScene from './StoryScene.jsx';
import CapacityChart from './CapacityChart.jsx';
import ContinuityGlyph from './ContinuityGlyph.jsx';
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
  const layoutRef=useRef(null),controlRef=useRef(null),growRef=useRef(null),disruptRef=useRef(null);
  const sector=getSector(sectorId);
  const view=sectorServices(describe(state),sector),outage=state.outageAge!==null;
  const finished=outage?view.complete:state.step>0&&view.mature&&state.ai===ai;
  const canDisrupt=!outage&&state.step>0&&!running&&state.ai>0;
  const signalMode=canDisrupt?'disrupt':!outage&&state.step===0&&!running?'start':null;
  useLayoutEffect(()=>{
    if(!signalMode){setReadySignal(null);return;}
    const target=signalMode==='disrupt'?disruptRef.current:growRef.current;
    const updateSignal=()=>{
      const layout=layoutRef.current?.getBoundingClientRect(),control=controlRef.current?.getBoundingClientRect(),button=target?.getBoundingClientRect();
      if(!layout||!control||!button)return;
      const gap=parseFloat(getComputedStyle(layoutRef.current).columnGap)||20;
      const x=control.left-layout.left-gap/2;
      const endX=button.left-layout.left+2;
      const endY=button.top-layout.top+button.height/2;
      const startY=Math.max(80,Math.min(endY-80,layout.height*.28));
      setReadySignal({mode:signalMode,width:layout.width,height:layout.height,path:`M${x} ${startY} V${endY} H${endX}`,endX,endY});
    };
    updateSignal();
    const observer=new ResizeObserver(updateSignal);
    [layoutRef.current,controlRef.current,target].forEach(element=>element&&observer.observe(element));
    window.addEventListener('resize',updateSignal);
    return ()=>{observer.disconnect();window.removeEventListener('resize',updateSignal);};
  },[signalMode,outageLoss,sectorId]);
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
  const progressLabel=finished&&!outage?'Kasvufaas lõpetatud':running?`Paus · ${stepsRemaining} sammu jäänud`:state.step>0&&!finished?`Jätka · ${stepsRemaining} sammu jäänud`:'Käivita simulatsioon';
  const aiAfterDisruption=Math.round(state.ai*(1-(outage?state.outageLoss:outageLoss)));
  const failureText=state.outageLoss>=.99?sector.failure:sector.failure.replaceAll('AI kaob','AI tugi väheneb').replaceAll('AI-ta','väiksema AI-toega');
  const balanceDelta=Math.round(view.capacity-view.promised);
  const balanceComparison=view.shortfall>1?{tone:'deficit',value:`−${Math.round(view.shortfall)}`,label:'puudu'}:balanceDelta>1?{tone:'surplus',value:`+${balanceDelta}`,label:'varu'}:{tone:'balanced',value:'0',label:'tasakaal'};
  const peakGain=Math.round(view.peak-100),outageDrop=Math.round(view.peak-view.capacity),baselineDelta=Math.round(view.capacity-100);
  const delayedServices=view.services.filter(service=>service.active&&service.status==='delayed').length;
  const isGrowthReady=!outage&&view.mature&&state.step>0;
  const message=outage?view.complete?failureText:state.outageAge<2?`${sector.staff} ja ${sector.automation.toLocaleLowerCase('et')} kaotavad esimesena töövõimet.`:sector.waiting+' Töö kuhjub ja uued tegevused aeglustuvad või seiskuvad.':isGrowthReady?(sector.ready||`${sector.org} on kasvatanud töömahtu eeldusel, et AI tugi jääb alles. Uued lubadused ja võetud kohustused sõltuvad nüüd sellest võimekusest.`):state.step>0?sector.growth:`Käivita kasv. Vaata, kuidas AI lisavõimekusest saavad uued kohustused. ${sector.waiting}`;
  const takeawayCopy=!outage&&state.step===0
    ?{eyebrow:'Alusta siit',title:'Käivita kasv',body:`Vaata, kuidas AI lisavõimekusest saavad uued kohustused. ${sector.waiting}`}
    :isGrowthReady
      ?{eyebrow:'Valmis testiks',title:'Pane toimepidevus proovile',body:message}
      :!outage
        ?{eyebrow:'Jälgi muutust',title:'Võimekus kasvatab kohustusi',body:message}
        :view.complete
          ?{eyebrow:'Järeldus',title:'Toimepidevus on proovile pandud',body:message}
          :{eyebrow:'Jälgi mõju',title:'Katkestus levib',body:message};
  return <main className={`${running?'running':'paused'} ${canDisrupt?'growth-ready':''} ${signalMode==='start'?'start-ready':''}`} data-step={state.step}>
    <header className="hero-intro"><div className="header-copy"><div className="hero-top"><div className="simulation-label"><i/>Interaktiivne simulatsioon <span>AI-sõltuvuse kujunemine</span></div><div className="hero-question"><span>Põhiküsimus</span><p>{sectorQuestion}</p></div></div><div className="hero-main"><div className="hero-title"><h1><em>AI-võimestatud töötaja</em> ja organisatsiooni <strong className="continuity-focus">toimepidevus</strong></h1><div className="sector-context"><span className="sector-context-label">Vali fookus</span><div className="hero-sector-select-wrap"><select id="sector" className="hero-sector-select" aria-label="Fookus" value={sectorId} onChange={e=>{changeSector(e.target.value);e.currentTarget.blur();}}>{SORTED_SECTORS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><span className="hero-sector-action" aria-hidden="true">Muuda<svg className="hero-sector-chevron" viewBox="0 0 20 20"><path d="m5 7 5 5 5-5"/></svg></span></div><span className="sector-context-description">{sectorContext}</span></div></div></div></div></header>
    <section className="main-layout" ref={layoutRef}>
      {readySignal&&<div className={`growth-ready-signal ${readySignal.mode==='start'?'start-ready-signal':''}`} aria-hidden="true">
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
        <div className="controls-title"><span>{outage?'Katkestuse tulemus':'Simulatsiooni juhtimine'}</span><b className="step-counter">{outage&&view.complete?`${TOTAL_STEPS} / ${TOTAL_STEPS} sammu`:`Samm ${Math.min(state.step,TOTAL_STEPS)} / ${TOTAL_STEPS}`}</b></div>
        {!outage&&<div className={`growth-action ${finished?'is-complete':''}`} aria-disabled={finished}>
          <div className="control-phase-title growth-phase"><span>1</span><strong>Kasvata organisatsiooni AI toel</strong></div>
          <label className="ai-label" htmlFor="ai">AI-võimenduse tase <strong>{ai}%</strong></label>
          <input id="ai" aria-label="AI-võimenduse tase" type="range" min="0" max="100" step="5" value={ai} disabled={running||finished} onChange={e=>setAI(Number(e.target.value))} style={{'--range':`${ai}%`}}/>
          <div className="range-ends"><span>AI tugi puudub</span><span>Maksimaalne võimendus</span></div>
          <button className={`grow progress-button ${running?'is-running':'is-paused'}`} ref={growRef} data-testid="progress-button" style={{'--progress':`${simulationProgress}%`}} disabled={finished} onClick={()=>setRunning(!running)}><span>{progressLabel}</span></button>
        </div>}
        {outage&&!view.complete&&<button className={`grow progress-button ${running?'is-running':'is-paused'}`} data-testid="progress-button" style={{'--progress':`${simulationProgress}%`}} onClick={()=>setRunning(!running)}><span>{progressLabel}</span></button>}
        {state.step>0&&!(finished&&!outage)&&<div className={`run-status ${running?'is-running':'is-paused'}`} role="status">{finished?'Simulatsioon lõpetatud · mõju on arvutatud':running?outage?'Katkestuse mõju levib…':'Vajuta pausi, kui tahad AI tuge vähendada.':outage?'Simulatsioon on pausil':'Simulatsioon on pausil. AI tuge saab nüüd vähendada.'}</div>}
        {!outage&&<div className={`outage-action ${canDisrupt?'is-ready':'is-locked'}`} aria-disabled={!canDisrupt}>
          <div className="control-phase-title outage-phase"><span>2</span><strong>Katkesta AI tugi</strong></div>
          <label className="outage-slider-label" htmlFor="outage-loss"><span>Kui suur osa olemasolevast AI-toest kaob?</span><strong>{Math.round(outageLoss*100)}%</strong></label>
          <input id="outage-loss" className="outage-range" aria-label="AI-toe katkestuse ulatus" type="range" min="0" max="100" step="10" value={Math.round(outageLoss*100)} disabled={!canDisrupt} onChange={e=>setOutageLoss(Number(e.target.value)/100)} style={{'--range':`${outageLoss*100}%`}}/>
          <div className="range-ends outage-ends"><span>AI tugi säilib</span><span>Kogu AI tugi kaob</span></div>
          {state.step>0&&<div className="outage-preview" aria-live="polite"><span>AI-võimenduse tase pärast katkestust</span><div><b>{state.ai}%</b><i>→</i><strong>{aiAfterDisruption}%</strong></div><small>Valitud {state.ai}% AI-võimendusest kaob {Math.round(outageLoss*100)}%; alles jääb {aiAfterDisruption}%.</small></div>}
          {!canDisrupt&&<div className="outage-locked-note">{running?'Vajuta pausi, kui tahad AI tuge vähendada.':'Käivita kasv ja peata simulatsioon'}</div>}
          {canDisrupt&&<div className="disruption-cue" role="status"><span aria-hidden="true">↓</span><div><strong>AI-toe vähendamine on nüüd võimalik</strong><small>Vali katkestuse ulatus ja vaata, kas lubatud ning kohustuseks võetud töömaht jääb täidetavaks.</small></div></div>}
          <button className="disrupt" ref={disruptRef} onClick={cutAI} disabled={!canDisrupt||outageLoss===0}><span>{outageLoss===1?'Katkesta AI tugi täielikult':outageLoss===0?'Vali AI-toe katkestuse ulatus':'Vähenda AI tuge'}</span>{outageLoss>0&&<small>Mõju levib {OUTAGE_STEPS} sammu</small>}</button>
          <div className="disruption-reasons"><strong>Miks võib AI tugi väheneda?</strong><ul><li><span>Tehnika</span><b>Tehniline rike</b></li><li><span>Küber</span><b>Küberrünnak</b></li><li><span>Geopoliitika</span><b>Konflikt või sanktsioonid</b></li><li><span>Tarneahel</span><b>Tarneahela häired</b></li><li><span>Teenusepakkuja</span><b>Teenusepakkuja või tema päritoluriigi otsused</b></li><li><span>Julgeolek</span><b>Hübriid- või otsene sõjaline rünnak</b></li></ul></div>
        </div>}
        {outage&&<section className={`outcome ${view.complete?'is-complete':'is-progress'}`} aria-live="polite">
          <div className="outcome-kicker"><span>{view.complete?'Lõpptulemus':'Vahetulemus'}</span><b>{view.complete?'Mõju on kohale jõudnud':'Mõju alles levib'}</b></div>
          <div className="outcome-path" aria-label={`Baastase 100, AI-toega tipp ${Math.round(view.peak)}, pärast katkestust ${Math.round(view.capacity)} tööühikut`}>
            <div><span>Baastase</span><strong>100</strong><small>enne AI-d</small></div>
            <i aria-hidden="true">→</i>
            <div><span>AI-toega tipp</span><strong>{Math.round(view.peak)}</strong><small>+{peakGain} tööühikut</small></div>
            <i aria-hidden="true">→</i>
            <div className="after"><span>Pärast katkestust</span><strong>{Math.round(view.capacity)}</strong><small>{baselineDelta>=0?`+${baselineDelta} baastasemest`:`${Math.abs(baselineDelta)} alla baastaseme`}</small></div>
          </div>
          <div className={`outcome-gap-card ${view.shortfall>1?'deficit':'covered'}`}>
            <small>{view.shortfall>1?'Täitmata kohustus':'Kohustused on kaetud'}</small>
            <div><strong>{view.shortfall>1?Math.round(view.shortfall):Math.max(0,Math.round(view.capacity-view.promised))}</strong><span>{view.shortfall>1?'tööühikut puudu':'tööühikut varu'}</span></div>
            <p><b>Suudame {Math.round(view.capacity)}</b><i/> <b>Kohustus {Math.round(view.promised)}</b></p>
          </div>
          {view.complete&&<><div className="outcome-service-impact"><strong>{view.stopped} {sector.stoppedNoun} seiskus</strong>{delayedServices>0&&<span>Lisaks {delayedServices} teenust või protsessi hilineb.</span>}</div><p className="outcome-conclusion">AI-toega kasvu ajal võetud kohustused jäid alles. Võimekus langes tipust {outageDrop} tööühiku võrra.{view.shortfall>1?` Organisatsioon suudab teha ${Math.round(view.capacity)}, kuid on kohustunud tegema ${Math.round(view.promised)} tööühikut.`:' Allesjäänud võimekus katab veel võetud kohustused.'}{view.capacity<100?' Töökorralduse ümberkujundamise tõttu jäädi ka alla AI-eelse baastaseme.':''}</p></>}
        </section>}
        <button className="reset" onClick={()=>reset()} aria-label="Käivita simulatsioon uuesti">Käivita simulatsioon uuesti</button>
        </aside>
        <ContinuityGlyph state={state} view={view} running={running}/>
      </div>
      <section className={`simulation-insight-card ${outage?'warning':''}`} aria-label="Simulatsiooni muutus ajas ja järeldus">
        <div className="scene-caption">{outage?<><b>Lubadused ja võetud kohustused ei kao koos AI-ga.</b> {sector.waiting}</>:state.adaptation>.1?<><b>{state.crossSector?'AI loob põhiteenuste peale uue ühise juhtimiskihi.':'Lisavõimekus muutub uueks töömahuks.'}</b> {sector.org} eeldab, et AI tugi jääb alles.</>:<><b>Alguses on võimekus ning lubatud ja kohustuseks võetud töö tasakaalus.</b> {sector.org} täidab oma seniseid kohustusi.</>}</div>
        <div className="simulation-footer">
          <CapacityChart history={history}/>
          <div className={`takeaway ${outage?'warning':''} ${isGrowthReady?'ready-to-test':''}`} aria-live="polite">
            <div className="takeaway-stage"><span>{phase+1}</span><small>{takeawayCopy.eyebrow}</small></div>
            <div className={`takeaway-copy ${outage&&view.complete?'is-conclusion':''}`}><strong>{takeawayCopy.title}</strong><p>{takeawayCopy.body}</p>{isGrowthReady&&<div className="takeaway-next-action"><span>Järgmine tegevus</span><b>Vähenda juhtpaneelil AI tuge</b><small>Vaata, kas kohustuste täitmiseks jätkub töövõimet.</small></div>}</div>
          </div>
        </div>
      </section>
    </section>
    <footer className="site-footer">
      <div className="footer-credit">
        <div className="footer-author"><span className="footer-monogram" aria-hidden="true">SK</span><div><small>Simulatsiooni autor</small><strong>Siim Klais</strong></div></div>
        <div className="footer-meta">
          <div className="footer-tools"><small>Tööriistad</small><span>VS Code, GPT-5.6 Sol Medium via Codex, GitHub</span></div>
        </div>
      </div>
      <div className="footer-note"><small>Metoodiline märkus</small><span>Tegemist on õppeotstarbelise simulatsiooniga, mis kasutab lihtsustatud ja mitteteaduslikke modelleerimisvõtteid.</span></div>
    </footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
