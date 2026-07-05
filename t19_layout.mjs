import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
// same data, two layouts: (A) reflowed blob (B) aligned columns (padded fields)
const rows=[];for(let i=0;i<180;i++)rows.push({svc:`worker_${i}`,zone:`zone_${i%8}`,st:i%4===0?'degraded':'healthy',lat:50+(i*3)%400});
rows[63]={svc:'POOL',zone:'shard1',st:'max=850',lat:'timeout=4200'};
rows[131]={svc:'BILLING',zone:'west',st:'tax=1.08',lat:'port=8443'};
const Q=[{q:'POOL max value?',a:['850']},{q:'POOL timeout?',a:['4200']},{q:'BILLING tax?',a:['1.08']},{q:'BILLING port?',a:['8443']}];
const blob=rows.map(r=>`${r.svc} ${r.zone} ${r.st} lat ${r.lat}`).join('\n');
const cols=rows.map(r=>`${r.svc.padEnd(12)}${r.zone.padEnd(10)}${String(r.st).padEnd(12)}${r.lat}`).join('\n');
const MODEL='gemini-3.1-pro-preview';
console.log(`\n=== T19 layout: blob vs columnar ===`);
async function ev(text,label,doReflow){
  const src=doReflow?(R.reflow(text)??text):text;
  const imgs=await R.renderTextToPngsWithCharLimit(src,468,38000,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Data (↵=newline):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<2;t++){let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${imgs.length}p billed=${billed} acc=[${accs.join(',')}]`);
}
await ev(blob,'reflowed-blob',true);
await ev(cols,'aligned-columns',false);
