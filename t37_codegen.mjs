import * as R from './render.bundle.mjs';
import { ask, b64, imageBilledTokens } from './lib.mjs';
import { readFileSync } from 'fs';
const MODEL='gemini-3.1-pro-preview';
const code=readFileSync('C:/Users/user/MicrosoftWork/nyx-research/lib.mjs','utf8')
  +'\n'+readFileSync('C:/Users/user/MicrosoftWork/nyx-research/micro-render.mjs','utf8');
console.log(`\n=== T37 code generation from imaged source | ${code.length}ch ===`);
const packed=R.reflow(R.neutralizeSentinel(code))??code;
const imgs=await R.renderTextToPngsWithCharLimit(packed,468,24000,{aa:true},4096);
const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
const ib=[{type:'text',text:'Source code rendered as image (↵=newline). Study its style and exports:'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
const r=await ask(MODEL,[...ib,{type:'text',text:'\nUsing the SAME style and the ask()/grade() helpers from this code, write a new async function `scoreImage(model, imgs, questions)` that renders questions against images and returns the fraction correct. Output ONLY the code.'}],400);
const code2=r.text;
// checks
const checks={usesAsk:/ask\(/.test(code2),usesGrade:/grade\(/.test(code2),isAsync:/async/.test(code2),correctName:/scoreImage/.test(code2),returnsFraction:/\/|fraction|correct/.test(code2)};
console.log(`billed=${billed}`);
console.log('generated code checks:',JSON.stringify(checks));
console.log('sample:',code2.slice(0,200).replace(/\n/g,' '));
