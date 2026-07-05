import * as R from './render.bundle.mjs';
import { ask, b64 } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms`);f[Math.floor(n*0.35)]=`IMPORTANT: pool max 850 timeout 4200`;return f.join('\n');}
const MODEL='gemini-3.1-pro-preview', C=prose(600); // ~30k chars
console.log(`\n=== T23 wall-clock latency: text vs image | ${C.length}ch ===`);
const packed=R.neutralizeSentinel(C);
const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(packed)??packed,468,38000,{aa:true},4096);
const ib=[{type:'text',text:'Data:'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
// 3 trials each, measure wall-clock
for(const [label,content] of [['TEXT',[{type:'text',text:C+'\nWhat is the pool max? Only value.'}]],['IMAGE',[...ib,{type:'text',text:'\nWhat is the pool max? Only value.'}]]]){
  let times=[];for(let t=0;t<3;t++){const t0=performance.now();await ask(MODEL,content,20);times.push(performance.now()-t0);}
  console.log(`${label}: ${times.map(x=>x.toFixed(0)).join(', ')} ms (avg ${(times.reduce((a,b)=>a+b)/3).toFixed(0)}ms)`);
}
