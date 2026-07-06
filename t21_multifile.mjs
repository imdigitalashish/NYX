import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
import { readFileSync } from 'fs';
const MODEL='gemini-3.1-pro-preview';
// 3 real small files concatenated with headers
const files=[
  '~/nyx-research/lib.mjs',
  '~/nyx-research/micro-render.mjs',
  '~/nyx-research/parse-bdf.mjs',
];
let combined='';
for(const f of files){combined+=`\n===== FILE: ${f.split('/').pop()} =====\n`+readFileSync(f,'utf8');}
console.log(`\n=== T21 multi-file single page | ${files.length} files, ${combined.length}ch ===`);
const Q=[
 {q:'in lib.mjs, what URL is the API endpoint (the fetch target host)?',a:['githubcopilot']},
 {q:'in micro-render.mjs, what is the default padX value?',a:['4']},
 {q:'in parse-bdf.mjs, what cell width CELL_W is used?',a:['4']},
];
const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(combined)??combined,468,60000,{aa:true},4096);
const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
const ib=[{type:'text',text:'Multiple files concatenated (↵=newline, ===== FILE markers):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}
const tt=(await ask(MODEL,[{type:'text',text:combined+'\nOK'}],1)).usage?.prompt_tokens;
console.log(`${imgs.length}p billed=${billed} (text=${tt}, ${((1-billed/tt)*100).toFixed(0)}% fewer) cross-file acc=${a}/${n}`);
