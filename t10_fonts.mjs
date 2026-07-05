// T10: FONT-TYPE experiment. Render text with REAL fonts via headless browser (any TTF),
// screenshot to PNG, measure density + accuracy per font on Opus (and Gemini).
// Fonts to test: Cascadia Mono, Consolas, Courier, condensed sans — at various sizes.
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const { chromium } = require('C:/Users/user/node_modules/playwright/index.js');
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';

function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc.`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];

async function renderFont(page, text, {font, size, weight='normal', lineHeight, letterSpacing='0px'}){
  const html=`<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#fff}
    pre{font-family:${font};font-size:${size}px;font-weight:${weight};line-height:${lineHeight||size+1}px;
        letter-spacing:${letterSpacing};color:#000;white-space:pre;padding:4px;
        -webkit-font-smoothing:antialiased}
  </style></head><body><pre id="t"></pre></body></html>`;
  await page.setContent(html);
  await page.$eval('#t', (el,t)=>{el.textContent=t;}, text);
  const box=await page.$eval('#t', el=>({w:Math.ceil(el.scrollWidth),h:Math.ceil(el.scrollHeight)}));
  await page.setViewportSize({width:Math.min(box.w+8,4000), height:Math.min(box.h+8,4000)});
  const png=await page.$('#t').then(e=>e.screenshot({type:'png'}));
  return {png:new Uint8Array(png), w:box.w, h:box.h};
}

const MODEL=process.argv[2]||'claude-opus-4.8';
const C=prose(120);
console.log(`\n=== T10 font types | ${MODEL} | ${C.length}ch ===`);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();

const CONFIGS=[
  {label:'Cascadia 12', font:'"Cascadia Mono"', size:12},
  {label:'Cascadia 10', font:'"Cascadia Mono"', size:10},
  {label:'Consolas 11', font:'Consolas', size:11},
  {label:'Consolas 9',  font:'Consolas', size:9},
  {label:'Courier 11',  font:'"Courier New"', size:11},
  {label:'Arial-Narrow 12', font:'"Arial Narrow", "Segoe UI"', size:12},
];
for(const cfg of CONFIGS){
  const img=await renderFont(page, C, cfg);
  const billed=await imageBilledTokens(MODEL,[{png:img.png}]);
  if(!billed){console.log(`${cfg.label}: FAIL`);continue;}
  const ib=[{type:'text',text:'Rendered text data:'},{type:'image_url',image_url:{url:`data:image/png;base64,${b64(img.png)}`}}];
  let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`${cfg.label}: ${img.w}x${img.h} billed=${billed} density=${(C.length/billed).toFixed(1)} acc=${a}/${n}`);
}
await browser.close();
