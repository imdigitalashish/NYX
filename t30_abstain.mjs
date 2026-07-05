import * as R from './render.bundle.mjs';
import { ask, b64 } from './lib.mjs';
function guid(){const h='0123456789abcdef';let s='';for(const n of [8,4,4,4,12]){for(let i=0;i<n;i++)s+=h[Math.floor(Math.random()*16)];s+='-'}return s.slice(0,-1);}
const ids=Array.from({length:12},()=>guid());
const lines=[];for(let i=0;i<250;i++)lines.push(`event ${i}: svc_${i%10} ok`);
ids.forEach((id,i)=>{lines[15+i*18]=`RES_${i} id=${id}`;});
const text=lines.join('\n'), MODEL='gemini-3.1-pro-preview', packed=R.reflow(R.neutralizeSentinel(text))??text;
const imgs=await R.renderTextToPngsWithCharLimit(packed,468,38000,{aa:true},4096);
const mkib=extra=>{const ib=[{type:'text',text:'Data(↵=nl):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});return ib;};
console.log(`\n=== T30 abstention prompt vs confabulation | ${ids.length} GUIDs ===`);
for(const [label,suffix] of [['normal',''],['abstain','\nIf you cannot read the exact characters with confidence, respond EXACTLY "UNSURE" instead of guessing.']]){
  let correct=0,wrong=0,unsure=0;
  for(let i=0;i<ids.length;i++){
    const r=await ask(MODEL,[...mkib(),{type:'text',text:`\nExact id of RES_${i}? Only the GUID.${suffix}`}],40);
    if(r.text.toLowerCase().includes(ids[i].toLowerCase()))correct++;
    else if(/unsure/i.test(r.text))unsure++;
    else wrong++;
  }
  console.log(`${label}: correct=${correct} wrong(confabulated)=${wrong} unsure=${unsure} /${ids.length}`);
}
