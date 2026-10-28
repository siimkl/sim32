import React from 'react';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const levelY=value=>164-clamp(value/340,0,1)*124;

export default function ContinuityGlyph({state,view,running}){
  const disrupted=state.outageAge!==null;
  const shortfall=view.shortfall>1;
  const capacityY=levelY(view.capacity);
  const promiseY=levelY(view.promised);
  const activeCommitments=view.services.filter(service=>service.active).length;
  const maximumCommitments=view.services.length;
  const remainingAI=state.ai/100*(disrupted?1-state.outageLoss:1);
  const shockActive=disrupted&&state.outageAge<3;
  const nodeWidth=maximumCommitments>5?28:36;
  const nodeGap=maximumCommitments>5?5:8;
  const rowWidth=maximumCommitments*nodeWidth+(maximumCommitments-1)*nodeGap;
  const rowStart=150-rowWidth/2;
  const capacityPath=`M18 ${capacityY.toFixed(1)} C58 ${(capacityY-5).toFixed(1)} 91 ${(capacityY+5).toFixed(1)} 130 ${capacityY.toFixed(1)} S216 ${(capacityY-4).toFixed(1)} 282 ${capacityY.toFixed(1)} L282 174 L18 174 Z`;
  const capacityLine=`M18 ${capacityY.toFixed(1)} C58 ${(capacityY-5).toFixed(1)} 91 ${(capacityY+5).toFixed(1)} 130 ${capacityY.toFixed(1)} S216 ${(capacityY-4).toFixed(1)} 282 ${capacityY.toFixed(1)}`;
  return <section
    className={`mechanism-card ${disrupted?'is-disrupted':'is-positive'} ${shortfall?'has-gap':'is-covered'} ${shockActive?'shock-active':''} ${running?'is-moving':'is-still'}`}
    data-testid="mechanism-card"
    data-phase={disrupted?'disrupted':'positive'}
    data-capacity-y={capacityY.toFixed(1)}
    data-promise-y={promiseY.toFixed(1)}
    data-active-commitments={activeCommitments}
    data-shortfall={shortfall?'true':'false'}
    aria-label="Võimekuse ja kohustuste sõnadeta süsteemivaade: AI-toega töövõime kannab kohustusi, katkestuse järel võimekus langeb, kuid kohustused jäävad"
  >
    <svg className="mechanism-glyph" viewBox="0 0 300 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{'--ai-strength':remainingAI}}>
      <defs>
        <linearGradient id="system-field-positive" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#74bd72" stopOpacity=".82"/><stop offset=".55" stopColor="#3f8f5c" stopOpacity=".9"/><stop offset="1" stopColor="#28634b"/></linearGradient>
        <linearGradient id="system-field-risk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7835c" stopOpacity=".88"/><stop offset=".55" stopColor="#b94f3d" stopOpacity=".94"/><stop offset="1" stopColor="#73333a"/></linearGradient>
        <linearGradient id="system-background-positive" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8f5e2"/><stop offset="1" stopColor="#c7dfc7"/></linearGradient>
        <linearGradient id="system-background-risk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0e7"/><stop offset="1" stopColor="#e8b9ad"/></linearGradient>
        <linearGradient id="system-deck-positive" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2f7251"/><stop offset=".5" stopColor="#7bbf68"/><stop offset="1" stopColor="#2f7251"/></linearGradient>
        <linearGradient id="system-deck-risk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#924236"/><stop offset=".5" stopColor="#da8651"/><stop offset="1" stopColor="#924236"/></linearGradient>
        <linearGradient id="system-gap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d44733" stopOpacity=".08"/><stop offset=".55" stopColor="#d44733" stopOpacity=".28"/><stop offset="1" stopColor="#8f2f31" stopOpacity=".5"/></linearGradient>
        <radialGradient id="system-core-live" cx="38%" cy="30%" r="70%"><stop offset="0" stopColor="#ecffb7"/><stop offset=".4" stopColor="#76c66e"/><stop offset="1" stopColor="#2c6f52"/></radialGradient>
        <radialGradient id="system-core-off" cx="38%" cy="30%" r="70%"><stop offset="0" stopColor="#ffd0b7"/><stop offset=".42" stopColor="#c95f47"/><stop offset="1" stopColor="#71343a"/></radialGradient>
        <pattern id="system-grid" width="15" height="15" patternUnits="userSpaceOnUse"><path d="M15 0H0V15" fill="none" stroke="#526c5c" strokeOpacity=".075" strokeWidth="1"/></pattern>
        <filter id="system-soft-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#263f35" floodOpacity=".28"/></filter>
        <filter id="system-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <rect className="system-background system-positive-bg" x="1" y="1" width="298" height="188" rx="18" fill="url(#system-background-positive)"/>
      <rect className="system-background system-risk-bg" x="1" y="1" width="298" height="188" rx="18" fill="url(#system-background-risk)"/>
      <rect x="1" y="1" width="298" height="188" rx="18" fill="url(#system-grid)"/>

      <g className="system-gap" opacity={shortfall?1:0}>
        <path d={`M24 ${promiseY+5} H276 V${capacityY} C218 ${capacityY-4} 84 ${capacityY+5} 24 ${capacityY} Z`} fill="url(#system-gap)"/>
        {[54,92,130,170,208,246].map((x,index)=><path key={x} className={`system-tension tension-${index%2}`} d={`M${x} ${promiseY+8} C${x+(index%2?7:-7)} ${(promiseY+capacityY)/2} ${x+(index%2?-5:5)} ${(promiseY+capacityY)/2} ${x} ${capacityY-2}`}/>) }
        <path className="system-gap-pulse" d={`M30 ${(promiseY+capacityY)/2} H270`}/>
      </g>

      <g className="system-capacity">
        <path className="system-capacity-field" d={capacityPath} fill={shortfall?'url(#system-field-risk)':'url(#system-field-positive)'}/>
        <path className="system-capacity-surface" d={capacityLine}/>
        {[42,72,102,132,168,198,228,258].map((x,index)=><path key={x} className={`system-support support-${index%3}`} d={`M${x} 169 V${Math.min(164,capacityY+7)}`}/>) }
      </g>

      <g className="system-ai-core" filter="url(#system-soft-shadow)">
        <circle className="system-core-aura aura-one" cx="150" cy="166" r="23"/>
        <circle className="system-core-aura aura-two" cx="150" cy="166" r="17"/>
        <circle className="system-core" cx="150" cy="166" r="11" fill={disrupted?'url(#system-core-off)':'url(#system-core-live)'}/>
        <path className="system-core-mark" d={disrupted?'M144 160l12 12M156 160l-12 12':'M150 157v18M141 166h18'}/>
        <path className="system-feed feed-left" d={`M141 158 C120 143 113 124 108 ${Math.min(158,capacityY+8)}`}/>
        <path className="system-feed feed-right" d={`M159 158 C180 143 187 124 192 ${Math.min(158,capacityY+8)}`}/>
      </g>

      <g className="system-promise-deck" transform={`translate(0 ${promiseY})`}>
        <rect className="system-deck-shadow" x="22" y="-1" width="256" height="12" rx="6"/>
        <rect className="system-deck" x="22" y="-5" width="256" height="10" rx="5" fill={disrupted?'url(#system-deck-risk)':'url(#system-deck-positive)'}/>
        <path className="system-deck-edge" d="M30 0H270"/>
        {view.services.map((service,index)=>{
          const x=rowStart+index*(nodeWidth+nodeGap);
          const active=index<activeCommitments;
          return <g key={service.id||index} className={`system-commitment-node ${active?'is-active':'is-future'}`} transform={`translate(${x} 0)`}>
            <rect x="0" y="-26" width={nodeWidth} height="20" rx="7"/>
            <circle cx={nodeWidth/2} cy="-16" r="4"/>
            <path d={`M${nodeWidth/2} -11V-6`}/>
          </g>;
        })}
        <g className="system-lock" opacity={disrupted?1:0} transform="translate(150 -7)">
          <path d="M-7-7v-4a7 7 0 0114 0v4"/>
          <rect x="-10" y="-7" width="20" height="15" rx="4"/>
          <circle cx="0" cy="0" r="2"/>
        </g>
      </g>

      <g className="system-shock" opacity={shockActive?1:0} filter="url(#system-glow)">
        <circle className="system-shock-ring ring-one" cx="150" cy="154" r="16"/>
        <circle className="system-shock-ring ring-two" cx="150" cy="154" r="29"/>
        <path className="system-shock-rays" d="M150 116v20M150 171v16M116 151h20M164 151h23M126 127l14 14M164 166l13 13M175 127l-15 15M138 165l-14 14"/>
        <path className="system-shards" d="M126 145l-14-9 17 2M173 139l18-12-10 21M127 162l-16 9 18-2M173 165l13 15-4-20"/>
      </g>
    </svg>
  </section>;
}
