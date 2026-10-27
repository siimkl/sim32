import React from 'react';

function WorkerIcon({robot=false}){return <svg viewBox="0 0 80 80" aria-hidden="true">{robot?<><path d="M40 9V19M15 35H9V52H15M65 35H71V52H65"/><rect x="17" y="20" width="46" height="42" rx="10"/><circle cx="30" cy="37" r="4"/><circle cx="50" cy="37" r="4"/><path d="M29 50H51M28 69H52"/></>:<><circle cx="40" cy="21" r="11"/><path d="M22 54V46Q22 35 40 35Q58 35 58 46V54M29 50V72M51 50V72M20 43L12 59M60 43L68 59"/></>}</svg>}

function DependencyPath({d,state='active',arrow=true}){
  const marker=state==='cut'?'url(#dependency-arrow-cut)':state==='future'?'url(#dependency-arrow-future)':'url(#dependency-arrow-active)';
  return <g className={`dependency-path ${state}`}>
    <path className="dependency-rail" d={d}/>
    <path className="dependency-flow" d={d} markerEnd={arrow?marker:undefined}/>
  </g>;
}
export default function StoryScene({state,view,sector}){
  const outage=state.outageAge!==null;
  const workforceHit=outage&&state.outageAge>=1;
  const remainingAI=outage?Math.round(state.ai*(1-state.outageLoss)):state.ai;
  const partialOutage=outage&&remainingAI>0;
  return <div className={`story-scene ${outage?'outage':''} ${state.crossSector?'cross-sector':''}`}>
    <div className="scene-content">
      <svg className="supply-lines" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="active-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4f8b58"/>
            <stop offset=".48" stopColor="#9bd47b"/>
            <stop offset=".66" stopColor="#d6ef9d"/>
            <stop offset="1" stopColor="#4f8b58"/>
          </linearGradient>
          <marker id="dependency-arrow-active" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="dependency-arrow-future" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="dependency-arrow-cut" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 8 4 0 8Z"/></marker>
        </defs>
        <DependencyPath state={outage?'cut':'active'} d="M140 210 H170 V110 H212"/>
        <DependencyPath state={outage?'cut':'active'} d="M170 210 V310 H212"/>
        <DependencyPath state={workforceHit?'cut':'active'} arrow={false} d="M420 110 H478 V210"/>
        <DependencyPath state={workforceHit?'cut':'active'} arrow={false} d="M420 310 H478 V210"/>
        {view.services.filter((_,i)=>!state.crossSector||i===0).map((s,i)=>{
          const pathState=!s.active?'future':s.status!=='working'?'cut':'active';
          const targetY=210/view.services.length+i*420/view.services.length;
          return <DependencyPath key={s.id} state={pathState} d={`M478 210 V${targetY} H510`}/>;
        })}
        <g className={`dependency-junctions ${outage?'cut':'active'}`}><circle cx="170" cy="210" r="5"/></g>
        <g className={`dependency-junctions ${workforceHit?'cut':'active'}`}><circle cx="478" cy="210" r="5"/></g>
      </svg>
      <div className="ai-source"><div className={`ai-core ${outage?'offline':''} ${partialOutage?'degraded':''}`}><span className="ai-core-label">AI võimendus</span><strong>{remainingAI}%</strong></div>{outage&&<><b>{partialOutage?'Tugi vähenes':'Tugi katkes'}</b><span className="source-alert">{partialOutage?`${Math.round(state.outageLoss*100)}% lisajõust kadus`:'Lisajõud kadus'}</span></>}</div>
      <div className="workforce">
        {[{name:sector.staff,value:view.people,base:55,robot:false},{name:sector.automation,value:view.automation,base:45,robot:true}].map(actor=><div key={actor.name} className={`workforce-actor ${workforceHit?'weakened':''}`}><div className="icon-stage"><div className={`worker-symbol ${actor.robot?'robot':''}`} style={{transform:`scale(${.72+Math.sqrt(actor.value/actor.base)*.3})`}}><WorkerIcon robot={actor.robot}/></div><span className="worker-number">{Math.round(actor.value)}<small>ühikut tööd</small></span></div><strong>{actor.name}</strong><span>{workforceHit?(partialOutage?'Väiksema AI-toega töövõime langes':'AI-ta ei jätku töövõimet'):state.ai?`AI toel ${Math.round(actor.value/actor.base*100-100)}% rohkem`:'Senised oskused ja tööviisid'}</span></div>)}
      </div>
      <div className="services">
        {view.services.map(service=><div key={service.id} data-service={service.id} title={state.crossSector?`${service.promise}${service.parent?'. Sõltub: '+view.services.find(s=>s.id===service.parent)?.name:'. Ahela algus'}`:service.promise} className={`service ${service.base?'existing-service':'added-service'} ${service.active?'active':'not-created'} ${service.status}`}>
          <div className="service-icon">{!service.active?'+':service.status==='stopped'?'×':service.status==='delayed'?'!':'✓'}</div>
          <div className="service-description"><div className="service-name">{service.name}{service.base?<span className="base-service">OLEMAS ENNE AI-D</span>:<span className="new-service">AI TOEL LISANDUV</span>}</div><p>{!service.active?service.promise:service.status==='stopped'?service.stopped:service.status==='delayed'?service.delayed:service.promise}</p><div className="service-progress"><span style={{width:`${service.active?service.ratio*100:0}%`}}/></div></div>
          <strong className="service-state">{!service.active?'Veel avamata':service.status==='stopped'?'SEISKUNUD':service.status==='delayed'?'HILINEB':service.base?'Toimib':'Uus lubadus'}</strong>
        </div>)}
      </div>
    </div>
    <div className="scene-caption">{outage?<><b>Lubadused ei kao koos AI-ga.</b> {sector.waiting}</>:state.adaptation>.1?<><b>{state.crossSector?'AI loob põhiteenuste peale uue ühise juhtimiskihi.':'Lisavõimekus muutub uueks töömahuks.'}</b> {sector.org} eeldab, et AI tugi jääb alles.</>:<><b>Alguses on töö ja võimekus tasakaalus.</b> {sector.org} täidab oma seniseid kohustusi.</>}</div>
  </div>;
}
