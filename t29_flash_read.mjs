import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} lat ${50+(i*3)%400}ms`);
 f[Math.floor(n*0.35)]=`IMPORTANT: pool max 850 timeout 4200`;f[Math.floor(n*0.73)]=`CRITICAL: tax 1.08 port 8443 grpc`;return f.join('\n');}
const C=prose(400), packed=R.reflow(R.neutralizeSentinel(C))??C;
const imgs=await R.renderTextToPngsWithCharLimit(packed,468,38000,{aa:true},4096);
const Q=[{q:'pool max?',a:['850']},{q:'timeout?',a:['4200']},{q:'tax?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
console.log(`\n=== T29 flash vs pro for imaged reads | ${C.length}ch ===`);
for(const MODEL of ['gemini-3.1-pro-preview','gemini-3.5-flash']){
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Data(↵=nl):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let a=0,n=0,t0=performance.now();for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\n${qq.q} Only value.`}],30);a+=grade(r.text,qq.a);n+=qq.a.length;}
  const ms=(performance.now()-t0)/Q.length;
  console.log(`${MODEL}: billed=${billed} acc=${a}/${n} avg-latency=${ms.toFixed(0)}ms/q`);
}
