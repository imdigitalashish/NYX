import * as R from './render.bundle.mjs';
import { renderMicro } from './micro-render.mjs';
import * as micro from './microatlas_tomthumb.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL='gemini-3.1-pro-preview', C=prose(800);
console.log(`\n=== T13b micro-atlas reflow-packed | ${C.length}ch ===`);
async function ev(r,label){
  const billed=await imageBilledTokens(MODEL,[{png:r.png}]);
  const ib=[{type:'text',text:'Rendered data (↵=newline):'},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(r.png)}`}}];
  let accs=[];for(let t=0;t<2;t++){let a=0,n=0;for(const qq of Q){const res=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(res.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${r.width}x${r.height} billed=${billed} density=${(C.length/billed).toFixed(1)} acc=[${accs.join(',')}]`);
}
// reflow (join newlines -> single string with ↵), then render micro at various widths (cols)
const packed=(R.reflow(C)??C);
for(const [cols,scale] of [[560,2],[560,3],[420,3],[700,2]]){
  const r=await renderMicro(packed, micro, {cols, scale, gap:1, rowGap:2});
  await ev(r,`4x6 s${scale} cols${cols}`);
}
