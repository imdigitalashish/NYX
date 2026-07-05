import { renderMicro } from './micro-render.mjs';
import * as atlas from './microatlas_5x7.mjs';
import { writeFileSync } from 'fs';
const sample = "IMPORTANT: pool max size 850 timeout 4200\nCRITICAL: tax 1.08 port 8443 grpc\nquick brown fox 0123456789";
const r = await renderMicro(sample, atlas, {cols:45, scale:4, gap:1, rowGap:2});
writeFileSync('preview_5x7_s4.png', r.png);
console.log(`${r.width}x${r.height}`);
