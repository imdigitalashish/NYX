// T7: SALIENCE-MASKED RENDERING (from VIST's PVE insight, adapted to frozen API).
// Hypothesis: strip/abbreviate high-frequency low-information tokens BEFORE render, so the
// readable-char budget holds MORE meaningful content. Test whether the model reconstructs
// gist + key facts from a salience-compressed render as well as from the full render.
// Combined with T3 geometry (single 2048px page).
import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';

// A realistic prose+data corpus (not synthetic rows) — where function words dominate
function proseCorpus(){
  const facts=[];
  for(let i=0;i<120;i++){
    facts.push(`The service named worker_${i} was deployed to the region that is called zone_${i%8} and it currently has a status of ${i%4===0?'degraded':'healthy'} with a measured latency of ${50+(i*3)%400} milliseconds on average over the period.`);
  }
  facts[41]=`IMPORTANT: The database connection pool for the primary shard has a maximum size of exactly 850 connections and a timeout value of 4200 milliseconds which must not be exceeded.`;
  facts[88]=`CRITICAL: The billing tax rate applied to all invoices in the western region is exactly 1.08 and the fallback endpoint runs on port 8443 using the grpc protocol.`;
  return facts.join('\n');
}
// salience compressor: drop common English stopwords + collapse verbose phrasings (lossless-ish for gist)
const STOP=new Set('the a an is are was were be been being to of in on at for and or but with that this it its as by from has have had will would can could should may might must not no'.split(' '));
function salienceCompress(text){
  return text.split('\n').map(line=>{
    return line.split(/\s+/).filter(w=>{
      const bare=w.toLowerCase().replace(/[^a-z0-9_]/g,'');
      return !STOP.has(bare); // keep everything not a stopword (keeps numbers, IDs, nouns)
    }).join(' ');
  }).join('\n');
}

const MODEL=process.argv[2]||'gemini-3.1-pro-preview';
const FULL=proseCorpus();
const COMP=salienceCompress(FULL);
console.log(`\n=== T7 salience-masked render | ${MODEL} ===`);
console.log(`full: ${FULL.length} chars | salience-compressed: ${COMP.length} chars (${(100*COMP.length/FULL.length).toFixed(0)}%)`);

const Q=[
 {q:'max size of the primary shard connection pool?',a:['850']},
 {q:'timeout value for the connection pool (ms)?',a:['4200']},
 {q:'billing tax rate in western region?',a:['1.08']},
 {q:'fallback endpoint port?',a:['8443']},
 {q:'what protocol does the fallback endpoint use?',a:['grpc']},
 {q:'roughly how many worker services are described?',a:['120','100']},
];

for(const [text,label] of [[FULL,'FULL text render'],[COMP,'SALIENCE-compressed render']]){
  const packed=R.reflow(text)??text;
  const imgs=await R.renderTextToPngsWithCharLimit(packed,408,999999,{aa:true},4096);
  const billed=await imageBilledTokens(MODEL,imgs);
  const ib=[{type:'text',text:label.includes('SALIENCE')?'Rendered data with stopwords removed for density (↵=newline). Infer meaning:':'Rendered data (↵=newline):'}];
  for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
  let acc=0,n=0;for(const qq of Q){const r=await ask(MODEL,[...ib,{type:'text',text:`\nQ:${qq.q}\nOnly the value.`}],40);acc+=grade(r.text,qq.a);n+=qq.a.length;}
  console.log(`${label}: ${imgs.length}p [${imgs.map(i=>i.width+'x'+i.height).join(',')}] billed=${billed} density=${(text.length/billed).toFixed(1)} acc=${acc}/${n}`);
}
