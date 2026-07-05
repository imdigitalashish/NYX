import { renderMicro } from './micro-render.mjs';
import * as atlas from './microatlas_tomthumb.mjs';
import { writeFileSync } from 'fs';
const sample = "IMPORTANT: pool max size 850 timeout 4200 ms\nCRITICAL: tax rate 1.08 port 8443 grpc\nThe quick brown fox 0123456789 ABCDEF";
const r = await renderMicro(sample, atlas, {cols:50, scale:4, gap:1, rowGap:2});
writeFileSync('preview_tomthumb_s4.png', r.png);
console.log(`${r.width}x${r.height}`);
