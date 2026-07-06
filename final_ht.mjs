// DEFINITIVE head-to-head: Nyx (all findings) vs narrow vs TEXT, large realistic doc, Gemini.
import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function doc(n){const f=[];for(let i=0;i<n;i++)f.push(`The service worker_${i} was deployed to region zone_${i%8} and currently has status ${i%4===0?'degraded':'healthy'} with latency ${50+(i*3)%400} ms over the reporting period.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: The primary shard connection pool has maximum size 850 connections and timeout 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: The western region billing tax rate is 1.08 and the fallback endpoint runs on port 8443 using grpc.`;return f.join('\n');}
const STOP=new Set('the a an is are was were be been to of in on at for and or but with that this it its as by from has have had will would over currently and'.split(' '));
function sal(t){return t.split('\n').map(l=>l.split(/\s+/).filter(w=>!STOP.has(w.toLowerCase().replace(/[^a-z0-9_]/g,''))).join(' ')).join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'pool timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL='gemini-3.1-pro-preview', FULL=doc(300), COMP=sal(FULL);
console.log(`\n=== DEFINITIVE Nyx vs narrow | ${MODEL} | full ${FULL.length}ch, salience ${COMP.length}ch ===`);
const tt=(await ask(MODEL,[{type:'text',text:FULL+'\nReply OK.'}],1)).usage?.prompt_tokens;
console.log(`TEXT baseline: ${tt} tokens`);
async function ev(imgs,label){
  const billed=await imageBilledTokens(MODEL,imgs);
  const ib=[{type:'text',text:'Rendered data (↵=newline, stopwords may be dropped):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<3;t++){let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${imgs.length}p billed=${billed} (${((1-billed/tt)*100).toFixed(0)}% vs text) acc=[${accs.join(',')}]`);
  return billed;
}
const px=await ev(await R.renderTextToPngsWithCharLimit(R.reflow(FULL)??FULL,312,22000,{aa:true},728),'NARROW (1568w,728h)');
const nyx=await ev(await R.renderTextToPngsWithCharLimit(R.reflow(COMP)??COMP,468,38000,{aa:true},4096),'NYX (salience+2348w+38k)');
console.log(`\n>>> Nyx ${nyx} vs narrow ${px} = ${((1-nyx/px)*100).toFixed(0)}% fewer | vs text = ${((1-nyx/tt)*100).toFixed(0)}% fewer`);
