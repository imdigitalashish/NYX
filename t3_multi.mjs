import { ask, b64 } from './lib.mjs';
import { encodeGrayPng } from './png.bundle.mjs';
async function blank(w,h){return await encodeGrayPng(new Uint8Array(w*h).fill(255),w,h);}
async function billed(model,w,h){
  const png=await blank(w,h);
  const base=await ask(model,[{type:'text',text:'x'}],1);
  const wi=await ask(model,[{type:'text',text:'x'},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(png)}`}}],1);
  if(!base.usage||!wi.usage)return null;
  return wi.usage.prompt_tokens-base.usage.prompt_tokens;
}
const MODELS=(process.argv[2]||'claude-opus-4.8,gpt-5.5').split(',');
const SIZES=[[768,768],[1568,728],[2048,768],[2048,2048],[4096,2048],[6144,4096]];
for(const m of MODELS){
  console.log(`\n=== ${m} : billed tokens by geometry ===`);
  console.log('WxH | Mpx | billedTok | tok/Mpx');
  for(const [w,h] of SIZES){
    const t=await billed(m,w,h);
    if(t===null){console.log(`${w}x${h} | FAIL`);continue;}
    console.log(`${w}x${h} | ${(w*h/1e6).toFixed(2)} | ${t} | ${(t/(w*h/1e6)).toFixed(0)}`);
  }
}
