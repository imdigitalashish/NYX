import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function guid(){const h='0123456789abcdef';let s='';for(const n of [8,4,4,4,12]){for(let i=0;i<n;i++)s+=h[Math.floor(Math.random()*16)];s+='-'}return s.slice(0,-1);}
const ids=Array.from({length:8},()=>guid());
const lines=[];for(let i=0;i<250;i++)lines.push(`event ${i}: svc_${i%10} region_${i%6} status ${i%4===0?'error':'ok'} count ${i*7%999}`);
ids.forEach((id,i)=>{lines[15+i*25]=`RESOURCE_${i} id=${id} owner team_${i}`;});
const text=lines.join('\n');
// extract exact IDs as a text sidecar (cheap in tokens, exact)
const sidecar='EXACT IDs:\n'+ids.map((id,i)=>`RESOURCE_${i}=${id}`).join('\n');
const MODEL='gemini-3.1-pro-preview';
const Qgist=[{q:'roughly how many events?',a:['250','200']},{q:'what statuses appear?',a:['error','ok']}];
const Qverb=ids.map((id,i)=>({q:`exact id of RESOURCE_${i}?`,a:[id]}));
console.log(`\n=== T25 gist-image + text-sidecar | ${text.length}ch, ${ids.length} IDs ===`);
const imgs=await R.renderTextToPngsWithCharLimit(R.reflow(R.neutralizeSentinel(text))??text,468,38000,{aa:true},4096);
// A) image only
async function ev(content,label,Qs){let a=0,n=0;for(const qq of Qs){const r=await ask(MODEL,[...content,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}return `${a}/${n}`;}
const ibImg=[{type:'text',text:'Data (↵=newline):'}];for(const im of imgs)ibImg.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
const billImg=await imageBilledTokens(MODEL,imgs.map(i=>({png:i.png})));
console.log(`IMAGE-only: billed=${billImg} gist=${await ev(ibImg,'',Qgist)} verbatim=${await ev(ibImg,'',Qverb)}`);
// B) image + sidecar
const ibBoth=[...ibImg,{type:'text',text:'\n'+sidecar}];
const sidecarTokens=Math.round(sidecar.length/3.5);
console.log(`IMAGE+sidecar: billed~=${billImg}+${sidecarTokens}(sidecar text) gist=${await ev(ibBoth,'',Qgist)} verbatim=${await ev(ibBoth,'',Qverb)}`);
