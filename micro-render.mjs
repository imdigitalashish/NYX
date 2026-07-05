// micro-render.mjs — render text using a micro-atlas into a PNG (grayscale).
import { encodeGrayPng } from './png.bundle.mjs';

export async function renderMicro(text, atlas, opts={}){
  const { MW, MH, microGlyph } = atlas;
  const cols = opts.cols || 200;
  const scale = opts.scale || 1;         // integer upscale of each cell pixel
  const gap = opts.gap ?? 1;             // px gap between glyph cells (in scaled px)
  const rowGap = opts.rowGap ?? 1;
  const padX = 4, padY = 4;
  const cellW = MW*scale, cellH = MH*scale;
  const advX = cellW + gap*scale, advY = cellH + rowGap*scale;

  // wrap text into lines of `cols` chars, honoring existing newlines
  const rawLines = text.split('\n');
  const lines=[];
  for(const rl of rawLines){
    if(rl.length<=cols){ lines.push(rl); }
    else { for(let i=0;i<rl.length;i+=cols) lines.push(rl.slice(i,i+cols)); }
  }
  const width = padX*2 + cols*advX;
  const height = padY*2 + lines.length*advY;
  const fb = new Uint8Array(width*height).fill(255); // white

  for(let ly=0; ly<lines.length; ly++){
    const line=lines[ly];
    for(let lx=0; lx<line.length; lx++){
      const cp=line.codePointAt(lx);
      const g=microGlyph(cp);
      if(!g) continue;
      const ox = padX + lx*advX;
      const oy = padY + ly*advY;
      for(let gy=0; gy<MH; gy++)for(let gx=0; gx<MW; gx++){
        if(!g[gy*MW+gx]) continue;
        // draw scaled block
        for(let sy=0; sy<scale; sy++)for(let sx=0; sx<scale; sx++){
          const px = ox+gx*scale+sx, py=oy+gy*scale+sy;
          if(px<width&&py<height) fb[py*width+px]=0; // ink
        }
      }
    }
  }
  const png = await encodeGrayPng(fb, width, height);
  return { png, width, height, chars: text.length, lines: lines.length };
}
