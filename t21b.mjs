import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
import { readFileSync, readdirSync } from 'fs';
const MODEL='gemini-3.1-pro-preview';
// pack ALL the research .mjs files into one image
const dir='C:/Users/user/MicrosoftWork/nyx-research';
const mjs=readdirSync(dir).filter(f=>f.endsWith('.mjs')).slice(0,12);
let combined='';for(const f of mjs){combined+=`\n===== ${f} =====\n`+readFileSync(dir+'/'+f,'utf8');}
console.log(`\n=== T21b pack ${mjs.length} files | ${combined.length}ch ===`);
const Q=[
 {q:'which file defines the imageBilledTokens function?',a:['lib.mjs','lib']},
 {q:'what MODEL string is used across the experiments?',a:['gemini-3.1-pro']},
];
for(const cap of [38000,60000]){
  const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(combined)??combined,468,cap,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Many files concatenated (===== FILE markers, ↵=newline):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`cap${cap}: ${imgs.length}p billed=${billed} acc=${a}/${n}`);
}
const tt=(await ask(MODEL,[{type:'text',text:combined.slice(0,1)+'OK'}],1)).usage?.prompt_tokens;
// text token estimate
console.log(`(combined ${combined.length}ch ~= ${Math.round(combined.length/3.5)} text tokens est)`);
