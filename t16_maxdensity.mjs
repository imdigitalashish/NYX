import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`The service worker_${i} deployed to region zone_${i%8} currently has status ${i%4===0?'degraded':'healthy'} with latency ${50+(i*3)%400} milliseconds over the reporting period.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: The primary shard connection pool maximum size is 850 and timeout is 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: The western tax rate is 1.08 and fallback port is 8443 using grpc.`;return f.join('\n');}
const STOP=new Set('the a an is are was were be been to of in on at for and or but with that this it its as by from has have had will would over currently and'.split(' '));
function compress(t){return t.split('\n').map(l=>l.split(/\s+/).map(w=>{const b=w.toLowerCase().replace(/[^a-z0-9_]/g,'');if(STOP.has(b))return '';if(/[0-9]/.test(w)||w.length<=3)return w;return w.replace(/(?<!^)[aeiou]/gi,'')}).filter(Boolean).join(' ')).join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL='gemini-3.1-pro-preview';
console.log(`\n=== T16 max EFFECTIVE density (compress+pack) ===`);
// grow original doc, compress, pack to 1 page, find max original-chars/token at 5/5
for(const rows of [400,600,800,1000]){
  const FULL=prose(rows), C=compress(FULL);
  const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(C)??C,468,60000,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Data (↵=newline, abbreviated/compressed, infer meaning):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<2;t++){let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`orig ${FULL.length}ch -> ${C.length}ch compressed, ${imgs.length}p billed=${billed} EFFECTIVE-density=${(FULL.length/billed).toFixed(1)} acc=[${accs.join(',')}]`);
}
