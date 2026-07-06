import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
import { readFileSync, readdirSync } from 'fs';
const MODEL='gemini-3.1-pro-preview';
const dir='~/nyx-research';
const mjs=readdirSync(dir).filter(f=>f.endsWith('.mjs')).slice(0,12);
let combined='';for(const f of mjs){combined+=`\n===== ${f} =====\n`+readFileSync(dir+'/'+f,'utf8');}
console.log(`\n=== T21c ${mjs.length} files ${combined.length}ch WITH sentinel-neutralize ===`);
const src=R.neutralizeSentinel(combined);
const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(src)??src,468,60000,{aa:true},4096);
const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
console.log(`${imgs.length}p billed=${billed} (was 6p/6355 before fix)`);
