import * as R from './render.bundle.mjs';
import { ask, b64 } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} lat ${50+(i*3)%400}ms`);f[Math.floor(n*0.35)]=`IMPORTANT: pool max 850 timeout 4200`;return f.join('\n');}
const MODEL='gemini-3.1-pro-preview', C=prose(300);
const packed=R.reflow(R.neutralizeSentinel(C))??C;
console.log(`\n=== T24 image size vs latency | ${C.length}ch ===`);
// same content, different widths (=different total pixels)
for(const cols of [312,468,700]){
  const imgs=await R.renderTextToPngsWithCharLimit(packed,cols,38000,{aa:true},4096);
  const px=imgs.reduce((a,i)=>a+i.width*i.height,0);
  const ib=[{type:'text',text:'Data:'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let times=[];for(let t=0;t<3;t++){const t0=performance.now();await ask(MODEL,[...ib,{type:'text',text:'\npool max? Only value.'}],20);times.push(performance.now()-t0);}
  console.log(`cols${cols}: ${imgs.length}p ${(px/1e6).toFixed(1)}Mpx, latency avg ${(times.reduce((a,b)=>a+b)/3).toFixed(0)}ms [${times.map(x=>x.toFixed(0)).join(',')}]`);
}
