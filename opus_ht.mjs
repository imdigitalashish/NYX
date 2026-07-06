import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
function prose(n){const f=[];for(let i=0;i<n;i++)f.push(`worker_${i} zone_${i%8} status ${i%4===0?'degraded':'healthy'} latency ${50+(i*3)%400}ms.`);
 f[Math.floor(n*0.35)]=`IMPORTANT: connection pool max size 850 timeout 4200 ms.`;
 f[Math.floor(n*0.73)]=`CRITICAL: tax rate 1.08 fallback port 8443 grpc.`;return f.join('\n');}
const Q=[{q:'pool max size?',a:['850']},{q:'timeout ms?',a:['4200']},{q:'tax rate?',a:['1.08']},{q:'port?',a:['8443']},{q:'protocol?',a:['grpc']}];
const MODEL='claude-opus-4.8', C=prose(120);
const packed=R.reflow(C)??C;
// TEXT baseline token count
async function textTokens(){const r=await ask(MODEL,[{type:'text',text:C+'\nReply OK.'}],1);return r.usage?.prompt_tokens;}
async function ev(imgs,label){
  const billed=await imageBilledTokens(MODEL,imgs);
  const ib=[{type:'text',text:'Rendered data (↵=newline):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let accs=[];for(let t=0;t<2;t++){let a=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly value.`}],40);a+=grade(r.text,qq.a);n+=qq.a.length;}accs.push(`${a}/${n}`);}
  console.log(`${label}: ${imgs.length}p billed=${billed} acc=[${accs.join(',')}]`);
  return billed;
}
console.log(`\n=== OPUS head-to-head | corpus ${C.length}ch ===`);
const tt=await textTokens(); console.log(`TEXT: ${tt} tokens (baseline, acc=5/5 trivially)`);
const px=await ev(await R.renderTextToPngsWithCharLimit(packed,312,22000,{aa:true},728),'NARROW (5x8)');
const best=await ev(await R.renderTextToPngsWithCharLimit(packed,240,999999,{aa:true,cellWBonus:6,cellHBonus:6},2048),'NYX-Opus (11x14)');
console.log(`\nvs TEXT ${tt}: narrow ${px} (${((1-px/tt)*100).toFixed(0)}%), nyx-opus ${best} (${((1-best/tt)*100).toFixed(0)}%)`);
