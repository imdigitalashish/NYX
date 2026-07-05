import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
const MODEL='gemini-3.1-pro-preview';
function doc(rows){
  const f=[];for(let i=0;i<rows;i++)f.push(`entry_${i}: module mod_${i%20} handler h_${i%15} calls svc_${i%10} returns code_${(i*3)%500} at ts_${1000000+i}`);
  // plant 8 facts spread through
  const facts=[[0.10,'ALPHA config max_size=850'],[0.22,'BETA timeout=4200ms'],[0.35,'GAMMA tax_rate=1.08'],[0.48,'DELTA port=8443'],[0.61,'EPSILON proto=grpc'],[0.74,'ZETA region=westus2'],[0.86,'ETA retries=7'],[0.95,'THETA shard=primary']];
  for(const [pos,txt] of facts)f[Math.floor(rows*pos)]=`>>> ${txt}`;
  return f.join('\n');
}
const Q=[{q:'ALPHA max_size?',a:['850']},{q:'BETA timeout?',a:['4200']},{q:'GAMMA tax_rate?',a:['1.08']},{q:'DELTA port?',a:['8443']},{q:'EPSILON proto?',a:['grpc']},{q:'ZETA region?',a:['westus2']},{q:'ETA retries?',a:['7']},{q:'THETA shard?',a:['primary']}];
console.log(`\n=== T33 sweet spot: max doc @ >=80% acc ===`);
for(const rows of [200,400,600,800]){
  const C=doc(rows), packed=R.reflow(R.neutralizeSentinel(C))??C;
  const imgs=await R.renderTextToPngsWithCharLimit(packed,468,38000,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Data(↵=nl, >>> marks key facts):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\n${qq.q} Only value.`}],30);a+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`${C.length}ch ${imgs.length}p billed=${billed}: ${a}/${n} (${(100*a/n).toFixed(0)}%)`);
}
