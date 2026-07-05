import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
const MODEL='gemini-3.1-pro-preview';
function doc(rows){const f=[];for(let i=0;i<rows;i++)f.push(`The entry number ${i} was processed by the module named mod_${i%20} which calls the service svc_${i%10} and returns the code_${(i*3)%500} at timestamp ${1000000+i} in the current run.`);
 const facts=[[0.15,'ALPHA config has max_size of 850'],[0.35,'BETA has timeout of 4200 ms'],[0.55,'GAMMA tax_rate is 1.08'],[0.75,'DELTA port is 8443'],[0.90,'EPSILON uses grpc protocol']];
 for(const[p,t]of facts)f[Math.floor(rows*p)]=`>>> ${t}`;return f.join('\n');}
const STOP=new Set('the a an is are was were be been to of in on at for and or but with that this it its as by from has have had will would over currently and which named'.split(' '));
function comp(t){return t.split('\n').map(l=>l.split(/\s+/).map(w=>{const b=w.toLowerCase().replace(/[^a-z0-9_]/g,'');if(STOP.has(b))return '';if(/[0-9]/.test(w)||w.length<=3)return w;return w.replace(/(?<!^)[aeiou]/gi,'')}).filter(Boolean).join(' ')).join('\n');}
const Q=[{q:'ALPHA max_size?',a:['850']},{q:'BETA timeout?',a:['4200']},{q:'GAMMA tax_rate?',a:['1.08']},{q:'DELTA port?',a:['8443']},{q:'EPSILON protocol?',a:['grpc']}];
const FULL=doc(500); // big, ~90k chars
console.log(`\n=== T34 compress impact on large doc | full ${FULL.length}ch ===`);
for(const [name,text] of [['full',FULL],['compressed',comp(FULL)]]){
  const packed=R.reflow(R.neutralizeSentinel(text))??text;
  const imgs=await R.renderTextToPngsWithCharLimit(packed,468,24000,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
  const ib=[{type:'text',text:'Data(↵=nl, >>> = key facts, may be abbreviated):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\n${qq.q} Only value.`}],30);a+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`${name}: ${text.length}ch ${imgs.length}p billed=${billed} acc=${a}/${n}`);
}
