// Tom Thumb 4x6 on OPUS (pixel-billed) — can fewer pixels/char beat the 8x12 Spleen density 7.4?
import * as R from './render.bundle.mjs';
import { renderMicro } from './micro-render.mjs';
import * as micro from './microatlas_tomthumb.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL=process.argv[2]||'claude-opus-4.8', C=prose(120);
console.log(`\n=== T13c TomThumb 4x6 on ${MODEL} | ${C.length}ch ===`);
async function ev(r,label){
  const billed=await imageBilledTokens(MODEL,[{png:r.png}]);
  const ib=[{type:'text',text:'Rendered data (↵=newline):'},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(r.png)}`}}];
  let accs=[];for(let t=0;t<3;t++){let a=0,n=0;for(const qq of Q){const res=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(res.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${r.width}x${r.height} billed=${billed} density=${(C.length/billed).toFixed(1)} acc=[${accs.join(',')}]`);
}
const packed=R.reflow(C)??C;
// scale controls glyph size: 4x6 native, s2=8x12, s3=12x18
for(const [cols,scale] of [[240,2],[240,3],[180,3]]){
  const r=await renderMicro(packed, micro, {cols, scale, gap:1, rowGap:2});
  await ev(r,`4x6 s${scale} (${4*scale}x${6*scale}px) cols${cols}`);
}
