// Nyx method vs narrow on Opus & GPT (pixel-scaling billing). Here the geometry trick
// can't help; test if density-knee + salience still beat narrow.
import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`The service worker_${i} deployed to zone_${i%8} has status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400} ms.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: primary shard connection pool max size 850 timeout 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: western region tax rate 1.08 fallback port 8443 grpc.`;return f.join('\n');}
const STOP=new Set('the a an is are was were be to of in on at for and or but with that this it its as by from has have had over'.split(' '));
function sal(t){return t.split('\n').map(l=>l.split(/\s+/).filter(w=>!STOP.has(w.toLowerCase().replace(/[^a-z0-9_]/g,''))).join(' ')).join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'pool timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL=process.argv[2];
const FULL=prose(300), COMP=sal(FULL);
async function ev(imgs,label,src){
  const billed=await imageBilledTokens(MODEL,imgs);
  const ib=[{type:'text',text:'Rendered data (↵=newline, stopwords may be dropped):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`${label}: ${imgs.length}p [${imgs.map(i=>i.width+'x'+i.height).join(',')}] billed=${billed} acc=${a}/${n}`);
  return billed;
}
console.log(`\n=== ${MODEL} | full ${FULL.length}ch salience ${COMP.length}ch ===`);
const px=await R.renderTextToPngsWithCharLimit(R.reflow(FULL)??FULL,312,22000,{aa:true},728);
const bpx=await ev(px,'NARROW (1568w,728h,full)',FULL.length);
// Nyx for pixel-billed providers: minimal pixels via density-knee + salience, keep 1568 width
const nyx=await R.renderTextToPngsWithCharLimit(R.reflow(COMP)??COMP,312,22000,{aa:true},728);
const bn=await ev(nyx,'NYX (salience+knee, min-pixel)',COMP.length);
console.log(`>>> Nyx ${bn} vs narrow ${bpx} = ${((1-bn/bpx)*100).toFixed(0)}% fewer`);
