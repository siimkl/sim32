import React from 'react';
import {OUTAGE_STEPS} from './story-model.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const scaleRadius=value=>18+clamp((value-60)/250,0,1)*24;
const stonePath=(cx,cy,r,turn=0)=>{
  const shape=[1,.9,.98,.86,1.03,.91,.97,.87,1.01,.92];
  return shape.map((factor,index)=>{
    const angle=-Math.PI/2+turn+index/shape.length*Math.PI*2;
    const radius=r*factor;
    const x=(cx+Math.cos(angle)*radius).toFixed(1);
    const y=(cy+Math.sin(angle)*radius).toFixed(1);
    return `${index?'L':'M'}${x} ${y}`;
  }).join(' ')+' Z';
};

export default function ContinuityGlyph({state,view,running}){
  const disrupted=state.outageAge!==null;
  const outageProgress=disrupted?clamp(state.outageAge/OUTAGE_STEPS,0,1):0;
  const peak=Math.max(100,view.peak);
  const capacityRatio=clamp(view.capacity/peak,0,1);
  const promiseRatio=clamp(view.promised/peak,0,1);
  const capacityRadius=scaleRadius(view.capacity);
  const promiseBaseRadius=scaleRadius(view.promised);
  const promiseRadius=disrupted?promiseBaseRadius*(1-.12*outageProgress):promiseBaseRadius;
  const peakRadius=scaleRadius(peak);
  const capacityY=disrupted?112+(1-capacityRatio)*52:127-clamp((view.capacity-100)/210,0,1)*34;
  const promiseY=disrupted?112+(1-promiseRatio)*34+outageProgress*5:127-clamp((view.promised-100)/180,0,1)*30;
  const blastActive=disrupted&&state.outageAge<3;
  return <section
    className={`mechanism-card ${disrupted?'is-disrupted':'is-positive'} ${blastActive?'blast-active':''} ${running?'is-moving':'is-still'}`}
    data-testid="mechanism-card"
    data-phase={disrupted?'disrupted':'positive'}
    data-capacity-radius={capacityRadius.toFixed(1)}
    data-promise-radius={promiseRadius.toFixed(1)}
    aria-label="Võimekuse ja kohustuste sõnadeta visuaal: AI katkestuse järel langeb võimekus kohustustest kiiremini"
  >
    <svg className="mechanism-glyph" viewBox="0 0 300 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id="glyph-positive-field" cx="50%" cy="40%" r="72%"><stop offset="0" stopColor="#e9f7df"/><stop offset=".58" stopColor="#d8edcf"/><stop offset="1" stopColor="#bfd9bf"/></radialGradient>
        <radialGradient id="glyph-risk-field" cx="50%" cy="46%" r="75%"><stop offset="0" stopColor="#fff1e7"/><stop offset=".62" stopColor="#f4d8cc"/><stop offset="1" stopColor="#ddaaa0"/></radialGradient>
        <radialGradient id="glyph-capacity" cx="32%" cy="25%" r="76%"><stop offset="0" stopColor="#dff8c9"/><stop offset=".48" stopColor="#65ad69"/><stop offset="1" stopColor="#25653e"/></radialGradient>
        <radialGradient id="glyph-promise" cx="32%" cy="25%" r="76%"><stop offset="0" stopColor="#edf7bc"/><stop offset=".5" stopColor="#8dbd61"/><stop offset="1" stopColor="#477345"/></radialGradient>
        <radialGradient id="glyph-capacity-risk" cx="32%" cy="25%" r="76%"><stop offset="0" stopColor="#ffd5be"/><stop offset=".48" stopColor="#d86a48"/><stop offset="1" stopColor="#8e2f2d"/></radialGradient>
        <radialGradient id="glyph-promise-risk" cx="32%" cy="25%" r="76%"><stop offset="0" stopColor="#ffe1b9"/><stop offset=".5" stopColor="#d38356"/><stop offset="1" stopColor="#934239"/></radialGradient>
        <linearGradient id="glyph-stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d7d8d0"/><stop offset=".48" stopColor="#a9aaa4"/><stop offset="1" stopColor="#777b78"/></linearGradient>
        <filter id="glyph-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#244933" floodOpacity=".24"/></filter>
        <filter id="glyph-risk-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#712e28" floodOpacity=".28"/></filter>
        <filter id="glyph-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <pattern id="glyph-grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#54725d" strokeOpacity=".09" strokeWidth="1"/></pattern>
      </defs>

      <rect className="glyph-field glyph-field-positive" x="1" y="1" width="298" height="188" rx="18" fill="url(#glyph-positive-field)"/>
      <rect className="glyph-field glyph-field-risk" x="1" y="1" width="298" height="188" rx="18" fill="url(#glyph-risk-field)"/>
      <rect x="1" y="1" width="298" height="188" rx="18" fill="url(#glyph-grid)"/>
      <path className="glyph-horizon" d="M20 148C65 132 102 142 150 129S240 118 280 131"/>
      <path className="glyph-energy-bridge" d={`M${92+capacityRadius*.72} ${capacityY-4} C130 ${capacityY-24} 171 ${promiseY-24} ${208-promiseRadius*.72} ${promiseY-4}`}/>
      <path className="glyph-drop-trail capacity-trail" d={`M92 55 C78 83 82 102 92 ${capacityY}`}/>
      <path className="glyph-drop-trail promise-trail" d={`M208 55 C222 82 220 100 208 ${promiseY}`}/>

      <g className="glyph-stones" style={{opacity:disrupted?.72:0}}>
        <g className="glyph-stone glyph-capacity-stone">
          <path d={stonePath(92,52,peakRadius*.72,.05)} fill="url(#glyph-stone)"/>
          <path className="glyph-crack" d="M82 36l8 12-7 9 12 13M105 38l-8 11 10 8-8 12"/>
        </g>
        <g className="glyph-stone glyph-promise-stone">
          <path d={stonePath(208,52,peakRadius*.68,.23)} fill="url(#glyph-stone)"/>
          <path className="glyph-crack" d="M197 35l10 12-8 10 10 12M220 39l-8 10 9 7-7 13"/>
        </g>
      </g>

      <g className="glyph-orbs">
        <g className="glyph-orb capacity-orb" filter={disrupted?'url(#glyph-risk-shadow)':'url(#glyph-shadow)'}>
          <circle className="glyph-orb-aura" cx="92" cy={capacityY} r={capacityRadius+8}/>
          <circle className="glyph-live-orb" cx="92" cy={capacityY} r={capacityRadius} fill={disrupted?'url(#glyph-capacity-risk)':'url(#glyph-capacity)'}/>
          <ellipse className="glyph-orb-shine" cx={92-capacityRadius*.27} cy={capacityY-capacityRadius*.34} rx={capacityRadius*.24} ry={capacityRadius*.16}/>
          <path className="glyph-orbit" d={`M${92-capacityRadius-6} ${capacityY}a${capacityRadius+6} ${Math.max(9,capacityRadius*.42)} 0 0 0 ${2*(capacityRadius+6)} 0`}/>
        </g>
        <g className="glyph-orb promise-orb" filter={disrupted?'url(#glyph-risk-shadow)':'url(#glyph-shadow)'}>
          <circle className="glyph-orb-aura" cx="208" cy={promiseY} r={promiseRadius+8}/>
          <circle className="glyph-live-orb" cx="208" cy={promiseY} r={promiseRadius} fill={disrupted?'url(#glyph-promise-risk)':'url(#glyph-promise)'}/>
          <ellipse className="glyph-orb-shine" cx={208-promiseRadius*.27} cy={promiseY-promiseRadius*.34} rx={promiseRadius*.24} ry={promiseRadius*.16}/>
          <path className="glyph-orbit" d={`M${208-promiseRadius-6} ${promiseY}a${promiseRadius+6} ${Math.max(9,promiseRadius*.42)} 0 0 0 ${2*(promiseRadius+6)} 0`}/>
        </g>
      </g>

      <g className="glyph-blast" style={{'--blast-progress':outageProgress}} filter="url(#glyph-glow)">
        <circle className="glyph-blast-core" cx="150" cy="92" r="8"/>
        <circle className="glyph-blast-ring ring-one" cx="150" cy="92" r="19"/>
        <circle className="glyph-blast-ring ring-two" cx="150" cy="92" r="32"/>
        <path className="glyph-blast-rays" d="M150 52v22M150 110v23M110 92h23M167 92h24M121 63l16 16M163 105l17 17M179 63l-16 16M137 105l-17 17"/>
        <path className="glyph-shards" d="M123 84l-13-9 17 2M176 78l16-12-9 20M124 104l-16 9 18-2M175 108l13 14-5-19"/>
      </g>
      <circle className="glyph-impact-ember" cx="150" cy="92" r="4"/>
    </svg>
  </section>;
}
