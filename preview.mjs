import { renderMicro } from './micro-render.mjs';
import * as atlas from './microatlas_4x6.mjs';
import { writeFileSync } from 'fs';
const sample = "IMPORTANT: connection pool max size 850 timeout 4200 ms.\nCRITICAL: tax rate 1.08 fallback port 8443 grpc.\nThe quick brown fox 0123456789 jumps over.";
for(const scale of [2,3]){
  const r = await renderMicro(sample, atlas, {cols:60, scale, gap:1, rowGap:1});
  writeFileSync(`preview_4x6_s${scale}.png`, r.png);
  console.log(`scale ${scale}: ${r.width}x${r.height}`);
}
