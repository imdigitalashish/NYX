import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const { chromium } = require('C:/Users/user/node_modules/playwright/index.js');
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc.`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
async function render(page,text,{font,size,lh,ls='0px',cols}){
  const html=`<!DOCTYPE html><html><head><style>*{margin:0;padding:0}body{background:#fff}
   pre{font-family:${font};font-size:${size}px;line-height:${lh}px;letter-spacing:${ls};color:#000;white-space:pre-wrap;word-break:break-all;width:${cols}px;padding:2px;-webkit-font-smoothing:antialiased}
  </style></head><body><pre id="t"></pre></body></html>`;
  await page.setContent(html); await page.$eval('#t',(el,t)=>el.textContent=t,text);
  const box=await page.$eval('#t',el=>({w:Math.ceil(el.scrollWidth),h:Math.ceil(el.scrollHeight)}));
  await page.setViewportSize({width:Math.min(box.w+4,4000),height:Math.min(box.h+4,4000)});
  const png=await page.$('#t').then(e=>e.screenshot({type:'png'}));
  return {png:new Uint8Array(png),w:box.w,h:box.h};
}
const MODEL=process.argv[2]||'claude-opus-4.8', C=prose(120);
console.log(`\n=== T10b DENSE fonts | ${MODEL} | ${C.length}ch ===`);
const browser=await chromium.launch({headless:true}); const page=await browser.newPage();
// push small sizes + tight line height + wide canvas to pack more per page
const CFG=[
 {label:'Consolas 8/8 w1600', font:'Consolas', size:8, lh:8, cols:1600},
 {label:'Consolas 7/7 w1600', font:'Consolas', size:7, lh:7, cols:1600},
 {label:'Consolas 6/6 w2000', font:'Consolas', size:6, lh:6, cols:2000},
 {label:'Cascadia 7/7 w1600', font:'"Cascadia Mono"', size:7, lh:7, cols:1600},
 {label:'Consolas 7/7 ls-0.5 w1600', font:'Consolas', size:7, lh:7, ls:'-0.5px', cols:1600},
];
for(const cfg of CFG){
  const img=await render(page,C,cfg);
  const billed=await imageBilledTokens(MODEL,[{png:img.png}]);
  const ib=[{type:'text',text:'Rendered text data:'},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(img.png)}`}}];
  let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`${cfg.label}: ${img.w}x${img.h} billed=${billed} density=${(C.length/billed).toFixed(1)} acc=${a}/${n}`);
}
await browser.close();
