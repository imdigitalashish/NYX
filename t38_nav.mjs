import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
const MODEL='gemini-3.1-pro-preview';
function doc(rows){const f=[];for(let i=0;i<rows;i++)f.push(`section_${Math.floor(i/100)} entry ${i}: data_${i%20} value ${(i*7)%9999} status ok`);
 f[350]='>>> TARGET_FACT: the critical threshold is exactly 8443';return f.join('\n');}
const C=doc(800), packed=R.reflow(R.neutralizeSentinel(C))??C;
const imgs=await R.renderTextToPngsWithCharLimit(packed,468,24000,{aa:true},4096);
const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
console.log(`\n=== T38 navigation hint | ${C.length}ch ${imgs.length}p ===`);
const mkib=()=>{const ib=[{type:'text',text:`Data across ${imgs.length} pages (↵=newline):`}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});return ib;};
// which page has the fact? entry 350 of 800 -> ~page 2-3
for(const [label,q] of [['no-hint','What is the critical threshold (TARGET_FACT)? Only value.'],
                        ['with-hint','The TARGET_FACT is roughly 44% through the document. What is the critical threshold? Only value.']]){
  let hits=0;for(let t=0;t<3;t++){const r=await ask(MODEL,[...mkib(),{type:'text',text:'\n'+q}],30);if(grade(r.text,['8443']))hits++;}
  console.log(`${label}: ${hits}/3 correct`);
}
