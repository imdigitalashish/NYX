// build-microatlas.mjs — generate a compact NxM bitmap atlas from a real font, tuned for
// VLM legibility. Renders each ASCII glyph large via headless browser, downsamples to the
// target cell, thresholds to a bitmap. Produces a JS module with the packed bits.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/user/node_modules/playwright/index.js');
const sharp = require(process.env.SHARP);

const CELL_W = parseInt(process.env.CW||'4');
const CELL_H = parseInt(process.env.CH||'6');
const FONT = process.env.FONT || '"Arial", sans-serif';
const RENDER_PX = 48; // render big, then downsample to CELL
const THRESH = parseInt(process.env.THRESH||'128');

const CHARS=[];for(let c=32;c<127;c++)CHARS.push(String.fromCharCode(c));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.setViewportSize({width:RENDER_PX,height:RENDER_PX});

const glyphs={}; // char -> Uint8Array(CELL_W*CELL_H) of 0/1
for(const ch of CHARS){
  const esc = ch==='<'?'&lt;':ch==='>'?'&gt;':ch==='&'?'&amp;':ch;
  const html=`<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0}
    body{width:${RENDER_PX}px;height:${RENDER_PX}px;background:#fff;overflow:hidden}
    #g{font-family:${FONT};font-size:${Math.round(RENDER_PX*0.85)}px;line-height:${RENDER_PX}px;
       color:#000;text-align:center;font-weight:600;width:${RENDER_PX}px;height:${RENDER_PX}px;
       display:flex;align-items:center;justify-content:center}
  </style></head><body><div id="g">${esc}</div></body></html>`;
  await page.setContent(html);
  const buf = await page.screenshot({type:'png', clip:{x:0,y:0,width:RENDER_PX,height:RENDER_PX}});
  // downsample to CELL_W x CELL_H, grayscale, threshold
  const raw = await sharp(buf).grayscale().resize(CELL_W,CELL_H,{kernel:'lanczos3',fit:'fill'}).raw().toBuffer();
  const bits=new Uint8Array(CELL_W*CELL_H);
  for(let i=0;i<CELL_W*CELL_H;i++) bits[i] = raw[i] < THRESH ? 1 : 0; // dark = ink = 1
  glyphs[ch]=bits;
}
await browser.close();

// pack: for each char, a bitstring MSB-first; store as hex per glyph
const packed={};
for(const ch of CHARS){
  const b=glyphs[ch]; let bytes=[];
  for(let i=0;i<b.length;i+=8){let byte=0;for(let j=0;j<8&&i+j<b.length;j++)byte=(byte<<1)|b[i+j];byte<<=(8-Math.min(8,b.length-i))%8;bytes.push(byte);}
  packed[ch.charCodeAt(0)]=Buffer.from(bytes).toString('hex');
}
const out=`// AUTO-GENERATED micro-atlas ${CELL_W}x${CELL_H} from ${FONT}
export const MW=${CELL_W}, MH=${CELL_H};
export const MICRO=${JSON.stringify(packed)};
export function microGlyph(cp){const h=MICRO[cp];if(!h)return null;const bits=new Uint8Array(MW*MH);let idx=0;for(let k=0;k<h.length;k+=2){let byte=parseInt(h.substr(k,2),16);for(let j=7;j>=0&&idx<MW*MH;j--){bits[idx++]=(byte>>j)&1;}}return bits;}
`;
writeFileSync(`microatlas_${CELL_W}x${CELL_H}.mjs`, out);
console.log(`wrote microatlas_${CELL_W}x${CELL_H}.mjs (${CHARS.length} glyphs, ${FONT})`);
