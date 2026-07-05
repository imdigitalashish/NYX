// T8b: adaptive multi-page at readability knee + salience. Flat billing on Gemini means
// N pages ~= N*1080 tok but each page stays readable. Find min pages for full accuracy.
import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`The service worker_${i} deployed to zone_${i%8} has status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400} ms over period.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: primary shard connection pool max size 850 timeout 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: western region tax rate 1.08 fallback port 8443 grpc.`;return f.join('\n');}
const STOP=new Set('the a an is are was were be to of in on at for and or but with that this it its as by from has have had over'.split(' '));
function sal(t){return t.split('\n').map(l=>l.split(/\s+/).filter(w=>!STOP.has(w.toLowerCase().replace(/[^a-z0-9_]/g,''))).join(' ')).join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'pool timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL='gemini-3.1-pro-preview';
const FULL=prose(400), COMP=sal(FULL);
console.log(`full ${FULL.length}ch salience ${COMP.length}ch`);
// vary per-page char cap on salience text -> controls pages & legibility
for(const cap of [18000,22000,30000]){
  const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(COMP)??COMP,408,cap,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs);
  const ib=[{type:'text',text:'Rendered data (↵=newline, stopwords dropped):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<2;t++){let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`cap${cap}: ${imgs.length}p billed=${billed} acc=[${accs.join(',')}]  (narrow-baseline was 4388@2/5)`);
}
