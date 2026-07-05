import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
const MODEL='gemini-3.1-pro-preview';
function huge(rows){const f=[];for(let i=0;i<rows;i++)f.push(`log ${i}: service_${i%30} op_${i%20} node_${i%15} bytes ${i*137%99999} status ${i%5===0?'FAIL':'ok'} region_${i%8}`);
 const facts=[[0.08,'FACT_A: the primary datacenter is in westus2'],[0.31,'FACT_B: max throughput is 850 requests/sec'],[0.52,'FACT_C: the SLA target is 99.95 percent'],[0.71,'FACT_D: incident count last week was 42'],[0.93,'FACT_E: the on-call rotation is 7 days']];
 for(const[p,t]of facts)f[Math.floor(rows*p)]=`>>> ${t}`;return f.join('\n');}
const Q=[{q:'primary datacenter (FACT_A)?',a:['westus2']},{q:'max throughput (FACT_B)?',a:['850']},{q:'SLA target (FACT_C)?',a:['99.95']},{q:'incident count (FACT_D)?',a:['42']},{q:'on-call rotation days (FACT_E)?',a:['7']}];
const C=huge(2000); // ~180k chars
const textTok=Math.round(C.length/3.5);
console.log(`\n=== T35 context extension | ${C.length}ch (~${textTok} text tokens) ===`);
const packed=R.reflow(R.neutralizeSentinel(C))??C;
const imgs=await R.renderTextToPngsWithCharLimit(packed,468,24000,{aa:true},4096);
const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
const ib=[{type:'text',text:'Large log (↵=nl, >>> = key facts across the whole log):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\n${qq.q} Only value.`}],30);a+=grade(r.text,qq.a);n+=qq.a.length;}
console.log(`${imgs.length}p billed=${billed} (${(100*(1-billed/textTok)).toFixed(0)}% fewer than text) facts-across-doc=${a}/${n}`);
