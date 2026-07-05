// parse-bdf.mjs — parse a BDF bitmap font into the micro-atlas format (4x6 cell).
import { readFileSync, writeFileSync } from 'node:fs';
const bdf = readFileSync('tomthumb.bdf','utf8');
const CELL_W=4, CELL_H=6;
const lines = bdf.split('\n');
const glyphs={};
let i=0;
while(i<lines.length){
  if(lines[i].startsWith('STARTCHAR')){
    let enc=-1, bbx=null, bitmap=[];
    while(!lines[i].startsWith('ENDCHAR')){
      const l=lines[i].trim();
      if(l.startsWith('ENCODING')) enc=parseInt(l.split(/\s+/)[1]);
      else if(l.startsWith('BBX')){const p=l.split(/\s+/);bbx={w:+p[1],h:+p[2],xoff:+p[3],yoff:+p[4]};}
      else if(l==='BITMAP'){
        i++;
        while(!lines[i].startsWith('ENDCHAR')){ bitmap.push(lines[i].trim()); i++; }
        break;
      }
      i++;
    }
    if(enc>=32 && enc<127 && bbx){
      // build CELL_W x CELL_H bitmap, place glyph per bbx (BDF y is from baseline up)
      const cell=new Uint8Array(CELL_W*CELL_H);
      // font ascent for tom-thumb: cap at top. Place rows from top with yoff.
      // BDF rows are top-to-bottom of the BBX. Vertical placement: baseline at row 5 (0-indexed),
      // glyph bottom = CELL_H - 1 - yoff (approx). We top-align within a 6px cell using yoff.
      const topRow = (CELL_H - bbx.h) - bbx.yoff; // where glyph's top row lands
      for(let r=0;r<bitmap.length;r++){
        const hex=bitmap[r]; if(!hex) continue;
        const byte=parseInt(hex,16);
        const bitsInRow = hex.length*4;
        for(let c=0;c<bbx.w;c++){
          const bit=(byte>>(bitsInRow-1-c))&1;
          if(bit){
            const px=c+bbx.xoff, py=topRow+r;
            if(px>=0&&px<CELL_W&&py>=0&&py<CELL_H) cell[py*CELL_W+px]=1;
          }
        }
      }
      glyphs[enc]=cell;
    }
  }
  i++;
}
// pack to hex
const packed={};
for(const enc of Object.keys(glyphs)){
  const b=glyphs[enc]; let bytes=[];
  for(let k=0;k<b.length;k+=8){let byte=0;for(let j=0;j<8&&k+j<b.length;j++)byte=(byte<<1)|b[k+j];byte<<=(8-Math.min(8,b.length-k))%8;bytes.push(byte);}
  packed[enc]=Buffer.from(bytes).toString('hex');
}
const out=`// Tom Thumb 4x6 micro-atlas (hand-designed bitmap font, public domain)
export const MW=${CELL_W}, MH=${CELL_H};
export const MICRO=${JSON.stringify(packed)};
export function microGlyph(cp){const h=MICRO[cp];if(!h)return null;const bits=new Uint8Array(MW*MH);let idx=0;for(let k=0;k<h.length;k+=2){let byte=parseInt(h.substr(k,2),16);for(let j=7;j>=0&&idx<MW*MH;j--){bits[idx++]=(byte>>j)&1;}}return bits;}
`;
writeFileSync('microatlas_tomthumb.mjs', out);
console.log(`parsed ${Object.keys(glyphs).length} glyphs from Tom Thumb BDF`);
