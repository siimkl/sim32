import React from 'react';

const WIDTH=680;
const HEIGHT=112;
const LEFT=42;
const RIGHT=20;
const TOP=18;
const BOTTOM=22;
const MAX_VALUE=350;

function pointPath(points){
  if(points.length===1)return `M${points[0].x} ${points[0].y}`;
  return points.map((point,index)=>`${index?'L':'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
}

export default function CapacityChart({history,individual=false}){
  const usableWidth=WIDTH-LEFT-RIGHT;
  const usableHeight=HEIGHT-TOP-BOTTOM;
  const x=index=>LEFT+(history.length===1?0:index/(history.length-1)*usableWidth);
  const y=value=>TOP+(1-Math.min(MAX_VALUE,value)/MAX_VALUE)*usableHeight;
  const capacityPoints=history.map((point,index)=>({x:x(index),y:y(point.capacity)}));
  const promisedPoints=history.map((point,index)=>({x:x(index),y:y(point.promised)}));
  const latest=history.at(-1);
  const outageIndex=history.findIndex(point=>point.outage);
  const outageX=outageIndex>=0?x(outageIndex):null;
  const capacityPath=pointPath(capacityPoints);
  const outageCapacityPath=outageIndex>=0?pointPath(capacityPoints.slice(Math.max(0,outageIndex-1))):'';
  const promisedPath=pointPath(promisedPoints);
  const capacityArea=capacityPoints.length>1?`${capacityPath} L${capacityPoints.at(-1).x} ${HEIGHT-BOTTOM} L${capacityPoints[0].x} ${HEIGHT-BOTTOM} Z`:'';
  const capacityLabel=individual?'Suudan teha':'Suudame teha';
  const promiseLabel=individual?'Olen lubanud ja kohustunud':'Lubasime ja kohustusime';
  return <section className={`trend-chart ${outageIndex>=0?'has-outage':''}`} data-testid="capacity-chart" aria-label={`${individual?'Doktorandi':'Organisatsiooni'} töövõime ning lubaduste ja kohustuste mahu muutus ajas`}>
    <div className="trend-heading">
      <div><small>Muutus ajas</small><strong>Võimekus, lubadused ja kohustused</strong></div>
      <div className="trend-legend" aria-hidden="true"><span className="capacity-key">{capacityLabel} <b>{Math.round(latest.capacity)}</b></span><span className="promise-key">{promiseLabel} <b>{Math.round(latest.promised)}</b></span></div>
    </div>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="capacity-chart-title capacity-chart-description" preserveAspectRatio="none">
      <title id="capacity-chart-title">{individual?'Doktorandi':'Organisatsiooni'} töövõime, lubadused ja kohustused ajas</title>
      <desc id="capacity-chart-description">Töövõime kasvab AI toel ning langeb AI-toe katkestuse järel. Lubatud ja kohustuseks võetud töömaht jääb katkestuse järel alles.</desc>
      <defs>
        <linearGradient id="capacity-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f8c68" stopOpacity=".22"/><stop offset="1" stopColor="#4f8c68" stopOpacity="0"/></linearGradient>
      </defs>
      {[0,100,200,300].map(value=><g className="chart-grid" key={value}><line x1={LEFT} x2={WIDTH-RIGHT} y1={y(value)} y2={y(value)}/><text x={LEFT-8} y={y(value)+4}>{value}</text></g>)}
      {outageX!==null&&<g className="outage-marker"><rect x={outageX} y={TOP} width={Math.max(0,WIDTH-RIGHT-outageX)} height={usableHeight}/><line x1={outageX} x2={outageX} y1={TOP-5} y2={HEIGHT-BOTTOM+2}/><text x={Math.min(outageX+7,WIDTH-116)} y={12}>AI-toe katkestus</text></g>}
      {capacityArea&&<path className="capacity-area" d={capacityArea}/>} 
      <path className="trend-line promise-line" d={promisedPath}/>
      <path className="trend-line capacity-line" d={capacityPath}/>
      {outageCapacityPath&&<path className="trend-line outage-capacity-line" d={outageCapacityPath}/>} 
      {capacityPoints.map((point,index)=><circle className={`trend-point capacity-point ${history[index].outage?'outage-point':''}`} key={`capacity-${history[index].key}`} cx={point.x} cy={point.y} r={index===capacityPoints.length-1?4:2.2}/>) }
      {promisedPoints.map((point,index)=><circle className="trend-point promise-point" key={`promise-${history[index].key}`} cx={point.x} cy={point.y} r={index===promisedPoints.length-1?3.5:2}/>) }
      <text className="chart-axis-label" x={LEFT} y={HEIGHT-4}>Algus</text><text className="chart-axis-label end" x={WIDTH-RIGHT} y={HEIGHT-4}>Praegu · samm {latest.step}</text>
    </svg>
  </section>;
}
