import {reportCSV,reportHTML} from '../lib/report-export.mjs';
export const money=(n:number,c='EUR')=>new Intl.NumberFormat(undefined,{style:'currency',currency:c}).format(n/100);
export const clone=<T,>(s:T):T=>JSON.parse(JSON.stringify(s));
export const field=(f:FormData,k:string)=>String(f.get(k)||'').trim();
export function downloadText(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export function exportReport(kind:string,name:string,rows:any[][],notify:(text:string)=>void){if(kind==='csv'){downloadText(name+'.csv',reportCSV(rows),'text/csv;charset=utf-8');return;}const w=window.open('','_blank');if(!w){notify('Allow pop-ups for Nela to open the PDF/print report.');return;}w.opener=null;w.document.open();w.document.write(reportHTML(name,rows));w.document.close();w.focus();w.print();}
