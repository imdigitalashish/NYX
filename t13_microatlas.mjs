// T13: Tom Thumb 4x6 micro-atlas vs Spleen 5x8. Does the smaller font read on Gemini,
// and does it push density past 36 char/tok?
import * as R from './render.bundle.mjs';
import { renderMicro } from './micro-render.mjs';
import * as micro from './microatlas_tomthumb.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL=process.argv[2]||'gemini-3.1-pro-preview';
console.log(`\n=== T13 micro-atlas 4x6 vs Spleen 5x8 | ${MODEL} ===`);
async function ev(imgs,label,chars){
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Rendered data:'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<2;t++){let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${imgs.length}p [${imgs.map(i=>i.width+'x'+i.height).join(',')}] billed=${billed} density=${(chars/billed).toFixed(1)} acc=[${accs.join(',')}]`);
}
const C=prose(800); // ~48k chars
// Spleen 5x8 baseline (best config from T12)
const spleen=await R.renderTextToPngsWithCharLimit(R.reflow(C)??C,468,999999,{aa:true},4096);
await ev(spleen,'Spleen 5x8 (2348w)',C.length);
// Tom Thumb 4x6 at scale 1 (native tiny) and scale 2
for(const scale of [1,2]){
  const r=await renderMicro(C, micro, {cols:468, scale, gap:1, rowGap:1});
  await ev([r],`TomThumb 4x6 scale${scale}`,C.length);
}
