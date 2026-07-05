// Opus deep sweep: Tom Thumb 4x6 at every scale + tight spacing vs Spleen 8x12 (density 7.4).
// Goal: does the crisper hand-designed 4x6 beat Spleen's density on Opus?
import * as R from './render.bundle.mjs';
import { renderMicro } from './micro-render.mjs';
import * as micro from './microatlas_tomthumb.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL='claude-opus-4.8', C=prose(120), packed=R.reflow(C)??C;
console.log(`\n=== T13d Opus micro-atlas sweep | ${C.length}ch (3 trials) ===`);
async function evMicro(cfg,label){
  const r=await renderMicro(packed, micro, cfg);
  const billed=await imageBilledTokens(MODEL,[{png:r.png}]);
  const ib=[{type:'text',text:'Rendered data (↵=newline):'},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(r.png)}`}}];
  let accs=[];for(let t=0;t<3;t++){let a=0,n=0;for(const qq of Q){const res=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(res.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${r.width}x${r.height} billed=${billed} density=${(C.length/billed).toFixed(1)} acc=[${accs.join(',')}]`);
}
// vary scale and gap: tighter gaps = denser. gap0 = touching glyphs.
await evMicro({cols:280,scale:2,gap:0,rowGap:1},'4x6 s2 gap0 (8x12,tight)');
await evMicro({cols:280,scale:2,gap:1,rowGap:1},'4x6 s2 gap1 rg1');
await evMicro({cols:240,scale:2,gap:1,rowGap:2},'4x6 s2 gap1 rg2');
// Spleen 8x12 reference
async function evSpleen(){
  const imgs=await R.renderTextToPngsWithCharLimit(packed,240,999999,{aa:true,cellWBonus:3,cellHBonus:4},2048);
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Rendered data (↵=newline):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<3;t++){let a=0,n=0;for(const qq of Q){const res=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(res.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`Spleen 8x12 (ref): billed=${billed} density=${(C.length/billed).toFixed(1)} acc=[${accs.join(',')}]`);
}
await evSpleen();
