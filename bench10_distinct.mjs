// 10 DISTINCT real-task benchmark. Different investigation types + topics. Gemini + Opus.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import * as R from './render.bundle.mjs';
import { ask, b64, grade, imageBilledTokens } from './lib.mjs';
const H = homedir().replace(/\\/g,'/');
const T = `${H}/investigationhistory`;
const S = `${H}/corpus/design-docs`;
const A = `${H}/Projects/OutageAgent/tto-reduction-investigation/current_sprint_icms`;

const TASKS = [
  // --- 3 distinct report investigation reports ---
  { name:'report report-1 (LM misroute)', file:`${T}/report-1.md`, Q:[
    {q:'current owner team?', a:['team-a']},
    {q:'hardware fault code number?', a:['10038']},
    {q:'misrouted or correct?', a:['misrout']}]},
  { name:'report report-3 (NIC link fault)', file:`${T}/report-3.md`, Q:[
    {q:'cable part number?', a:['1002971321']},
    {q:'NIC module type?', a:['connectx-5','connectx']},
    {q:'NIC side or TOR side fault?', a:['nic']}]},
  { name:'report report-2 (subsystem-x)', file:`${T}/report-2.md`, Q:[
    {q:'affected node region?', a:['spaincentral']},
    {q:'was BackplaneCrashes zero?', a:['zero','0']},
    {q:'owning team?', a:['team-a']}]},
  // --- 3 distinct SLI design docs ---
  { name:'SLI design-doc-4', file:`${S}/design-doc-4/SLI_Design_Document.md`, Q:[
    {q:'the SLI target percentage per tenant per 30d?', a:['99.99']},
    {q:'which KAS rule fires this (GetDesignMetric...)?', a:['getdesignmetric','metric']},
    {q:'telemetry source table name?', a:['trace','traceall']}]},
  { name:'SLI design-doc-5', file:`${S}/design.design-doc-5/SLI_Design_Document.md`, Q:[
    {q:'what scenario/feature does this SLI cover (export to what)?', a:['pdf']},
    {q:'is this a portal or platform reliability SLI?', a:['portal']}]},
  { name:'SLI design-doc-6', file:`${S}/design.design-doc-6/SLI_Design_Document.md`, Q:[
    {q:'what compute engine does this cover (Spark/SQL)?', a:['spark']},
    {q:'what operation does it measure (session ...)?', a:['acquisition','session']}]},
  // --- 4 distinct TTO action-items ---
  { name:'TTO doc-7 module-a', file:`${A}/doc-7-functionset-deploysourcecode/action-items.md`, Q:[
    {q:'what report id?', a:['doc-7']},
    {q:'what is being deployed (module-a/source code)?', a:['functionset','source']}]},
  { name:'TTO doc-8 module-b', file:`${A}/doc-8-analytics-coordinator/action-items.md`, Q:[
    {q:'what report id?', a:['doc-8']},
    {q:'what component (Analytics...)?', a:['analytics','coordinator']}]},
  { name:'TTO doc-9 OpenAI Tenant', file:`${A}/doc-9-openai-tenant-settings/action-items.md`, Q:[
    {q:'what report id?', a:['doc-9']},
    {q:'what OpenAI feature (tenant ...)?', a:['tenant','settings']}]},
  { name:'TTO doc-10 OpenAI Stream', file:`${A}/doc-10-openai-stream-completion/action-items.md`, Q:[
    {q:'what report id?', a:['doc-10']},
    {q:'what OpenAI operation (stream ...)?', a:['stream','completion']}]},
];

const MODELS = ['gemini-3.1-pro-preview','claude-opus-4.8'];
const PROFILE = {
  'gemini-3.1-pro-preview': { cols:468, cap:24000, wb:0, hb:0, mh:4096 },
  'claude-opus-4.8':        { cols:240, cap:22000, wb:3, hb:4, mh:2048 },
};
function renderFor(text,p){const packed=R.reflow(R.neutralizeSentinel(text))??text;return R.renderTextToPngsWithCharLimit(packed,p.cols,p.cap,{aa:true,cellWBonus:p.wb,cellHBonus:p.hb},p.mh);}

const results=[];
for(const task of TASKS){
  let text; try{text=readFileSync(task.file,'utf8');}catch{console.error('MISSING',task.file);continue;}
  const textTokEst=Math.round(text.length/3.5);
  const row={name:task.name,chars:text.length,textTokEst,per:{}};
  for(const model of MODELS){
    const p=PROFILE[model];
    const imgs=await renderFor(text,p);
    const billed=await imageBilledTokens(model,imgs.map(i=>({png:i.png})));
    const ib=[{type:'text',text:'Rendered document (↵=newline):'}];for(const im of imgs)ib.push({type:'image_url',image_url:{url:`data:image/png;base64,${b64(im.png)}`}});
    let a=0;const nq=task.Q.length;
    for(const qq of task.Q){const r=await ask(model,[...ib,{type:'text',text:`\nQ:${qq.q}\nAnswer with only the value.`}],40);if(grade(r.text,qq.a)>0)a++;}
    row.per[model]={pages:imgs.length,billed,correct:a,nq,acc:`${a}/${nq}`};
    process.stdout.write('.');
  }
  results.push(row);
}
console.log('');
writeFileSync('bench10_distinct.json',JSON.stringify(results,null,2));
console.log('saved bench10_distinct.json');
