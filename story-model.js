export const clamp=n=>Math.max(0,Math.min(1,n));
export const GROWTH_STEPS=10;
export const OUTAGE_STEPS=10;
export const TOTAL_STEPS=GROWTH_STEPS+OUTAGE_STEPS;
export const initialState=(crossSector=false)=>({step:0,ai:0,adaptation:0,outageAge:null,outageLoss:0,crossSector,parentRatios:{}});
export function advance(state,ai){
  if(state.outageAge!==null){
    if(state.outageAge>=OUTAGE_STEPS)return state;
    return {...state,step:state.step+1,outageAge:state.outageAge+1,parentRatios:Object.fromEntries(describe(state).services.map(s=>[s.id,s.ratio]))};
  }
  const target=ai/100;
  if(state.ai===ai&&state.adaptation>=target-1e-9)return state;
  const nextAdaptation=state.adaptation+target/GROWTH_STEPS;
  const adaptation=nextAdaptation>=target-1e-9?target:nextAdaptation;
  return {...state,step:state.step+1,ai,adaptation:Math.max(state.adaptation,adaptation)};
}
export function disrupt(state,loss=1){return state.ai>0&&state.outageAge===null?{...state,step:Math.max(state.step,GROWTH_STEPS),outageAge:0,outageLoss:clamp(loss)}:state;}
export const SERVICE_DEFINITIONS=[
  {id:'support',name:'Klienditugi',promise:'Vastame klientide küsimustele',base:40,parent:null},
  {id:'orders',name:'Tellimuste täitmine',promise:'Täidame juba võetud tellimused',base:60,parent:null},
  {id:'always',name:'Ööpäevaringne teenindus',promise:'Lubame abi ka öösel ja nädalavahetusel',threshold:.1,parent:'support'},
  {id:'personal',name:'Personaalsed pakkumised',promise:'Lubame igale kliendile sobiva pakkumise',threshold:.4,parent:'orders'},
  {id:'express',name:'Kiirteenindus',promise:'Lubame personaalse tellimuse kiiremini täita',threshold:.7,parent:'personal'},
];
export const CROSS_SECTOR_DEFINITIONS=[
  {id:'infra',base:40,parent:null},
  {id:'payments',base:60,parent:'infra'},
  {id:'freight',threshold:.1,parent:'payments'},
  {id:'factory',threshold:.25,parent:'freight'},
  {id:'care',threshold:.4,parent:'factory'},
  {id:'public',threshold:.55,parent:'care'},
  {id:'citizen',threshold:.7,parent:'public'},
];
export function describe(state){
  const {ai,adaptation,outageAge,outageLoss=0}=state;
  const peak=100+ai/100*70+adaptation*140;
  const manual=100-adaptation*22;
  const workforceLoss=outageAge===null?0:clamp(outageAge/(state.crossSector?2:OUTAGE_STEPS));
  const capacity=peak-(peak-manual)*workforceLoss*outageLoss;
  // Existing work buffers the immediate shock. Service failures follow the capacity loss.
  const serviceLoss=outageAge===null?0:clamp((outageAge-1)/(state.crossSector?3:OUTAGE_STEPS-1));
  const serviceCapacity=peak-(peak-manual)*serviceLoss*outageLoss;
  const baseRatio=Math.min(1,serviceCapacity/100);
  const crossBaseRatio=outageAge===null?1:outageLoss>=.99?baseRatio:Math.min(baseRatio,1-.22*outageLoss*serviceLoss);
  let remaining=Math.max(0,serviceCapacity-100);
  const services=[];
  for(const definition of (state.crossSector?CROSS_SECTOR_DEFINITIONS:SERVICE_DEFINITIONS)){
    const demand=definition.base||(state.crossSector?36:60)*clamp((adaptation-definition.threshold)/.3);
    const parent=services.find(s=>s.id===definition.parent);
    // Cross-sector contracts have one-step buffers. A downstream service relies on
    // its supplier's previous-step output, so the failure advances one sector at a time.
    const upstream=state.parentRatios?.[definition.parent]??1;
    const crossRatio=!definition.parent?crossBaseRatio:definition.base?upstream:upstream<.95?0:1;
    const delivered=state.crossSector?demand*(outageAge===null?1:crossRatio):definition.base?demand*baseRatio:Math.min(demand,remaining,demand*(parent?.ratio??1));
    if(!definition.base)remaining=Math.max(0,remaining-delivered);
    const ratio=demand>0?delivered/demand:1;
    services.push({...definition,demand,delivered,ratio,active:demand>.01,status:ratio<.05?'stopped':ratio<.95?'delayed':'working'});
  }
  const promised=services.reduce((sum,s)=>sum+s.demand,0);
  return {peak,manual,capacity,promised,services,shortfall:Math.max(0,promised-capacity),
    mature:adaptation>=ai/100-1e-9,complete:outageAge===OUTAGE_STEPS,
    people:Math.round(capacity*.55),automation:capacity-Math.round(capacity*.55),
    stopped:services.filter(s=>s.active&&s.status==='stopped').length};
}
