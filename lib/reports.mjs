import {isoDate,periodFor,periodTotals,advanceDate} from './finance.mjs';
import {dayAfter,budgetAllowance,annualizedCost} from './monthly.mjs';
export const dayCount=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
export function monthOffset(month,n){const d=new Date(month+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7);}
export function reportPeriod(ledger,month,mode='calendar',today=isoDate()){
 const day=mode==='salary'?ledger.settings.cycleDay:1;
 const p=periodFor(`${month}-${String(day).padStart(2,'0')}`,day);
 const actualEnd=today<p.start?p.start:today<p.end?dayAfter(today):p.end;
 return {...p,actualEnd,days:dayCount(p.start,actualEnd),label:month};
}
function summarize(ledger,currency,p,end=p.actualEnd){
 const total=periodTotals(ledger,currency,p.start,end);
 const entries=total.transactions.filter(t=>['expense','refund','income'].includes(t.kind));
 const expense=entries.filter(t=>t.kind==='expense'),returns=entries.filter(t=>t.kind==='refund');
 const gross=expense.reduce((n,t)=>n+t.amount,0),returned=returns.reduce((n,t)=>n+t.amount,0);
 const categories=new Map(),necessity={essential:0,optional:0,unclassified:0},spendingType={recurring:0,'one-time':0,unclassified:0},merchants=new Map(),subcategories=new Map();
 const original=new Map(ledger.transactions.map(t=>[t.id,t]));
 for(const t of entries){if(t.kind!=='expense'&&t.kind!=='refund')continue;
  const source=t.kind==='refund'?original.get(t.originalId)||t:t,sign=t.kind==='refund'?-1:1,value=t.amount*sign;
  categories.set(t.category,(categories.get(t.category)||0)+value);
  const n=source.necessity||'unclassified',type=source.recurringId&&(!source.spendingType||source.spendingType==='unclassified')?'recurring':source.spendingType||'unclassified';
  necessity[n]+=value;spendingType[type]+=value;
  const merchant=(source.merchant||'').trim(),key=merchant.toLocaleLowerCase();
  const row=merchants.get(key)||{key,name:merchant||'No merchant recorded',amount:0};row.amount+=value;merchants.set(key,row);
  const sub=source.subcategory||'Unspecified',subkey=JSON.stringify([t.category,sub]);
  const sr=subcategories.get(subkey)||{category:t.category,subcategory:sub,amount:0};sr.amount+=value;subcategories.set(subkey,sr);
 }
 return{...p,end,entries,gross,returned,spent:gross-returned,income:total.income,surplus:total.income-gross+returned,categories,necessity,spendingType,merchants,subcategories,hasRecords:entries.length>0};
}
export function monthlyReport(ledger,{currency='EUR',month=isoDate().slice(0,7),mode='calendar',comparison=monthOffset(month,-1),history=6,baseline=3,alignment='elapsed',today=isoDate()}={}){
 history=Math.min(6,Math.max(1,Number(history)||6));baseline=Number(baseline)===6?6:3;
 const period=reportPeriod(ledger,month,mode,today),previous=reportPeriod(ledger,comparison,mode,today);
 const matchedDays=Math.min(period.days,previous.days);
 const current=summarize(ledger,currency,period),left=summarize(ledger,currency,period,alignment==='elapsed'?dayAfter(period.start,matchedDays):period.actualEnd),right=summarize(ledger,currency,previous,alignment==='elapsed'?dayAfter(previous.start,matchedDays):previous.actualEnd);
 const historic=Array.from({length:Math.max(history,baseline)},(_,i)=>reportPeriod(ledger,monthOffset(month,-i-1),mode,today));
 const trendDays=Math.min(period.days,...historic.map(p=>p.days));
 const aligned=p=>summarize(ledger,currency,p,alignment==='elapsed'?dayAfter(p.start,trendDays):p.actualEnd);
 const alignedCurrent=aligned(period);
 const trend=[alignedCurrent,...historic.slice(0,history).map(aligned)].reverse();
 const baselineMonths=historic.slice(0,baseline).map(aligned).filter(p=>p.hasRecords&&p.days>0);
 const baselineAverage=baselineMonths.length?Math.round(baselineMonths.reduce((n,p)=>n+p.spent,0)/baselineMonths.length):null;
 const names=new Set([...current.categories.keys(),...left.categories.keys(),...right.categories.keys(),...ledger.budgets.filter(b=>b.currency===currency).map(b=>b.category)]);
 const categories=[...names].map(category=>{
  const budget=ledger.budgets.find(b=>b.currency===currency&&b.category===category);let allocated=null;
  if(budget){if(mode==='salary')allocated=budgetAllowance(ledger,budget,period.start,period.end).available;else{const terms=[...(budget.history||[]),{start:budget.effectiveFrom||'0001-01-01',amount:budget.amount}].filter(v=>v.start<period.end).sort((a,b)=>a.start.localeCompare(b.start));allocated=terms.at(-1)?.amount??null;}}
  const amount=current.categories.get(category)||0,a=left.categories.get(category)||0,b=right.categories.get(category)||0;
  const average=baselineMonths.length?Math.round(baselineMonths.reduce((n,p)=>n+(p.categories.get(category)||0),0)/baselineMonths.length):null;
  const rule=(ledger.spendingAlerts||[]).find(r=>r.currency===currency&&r.category===category);
  const alerts=[];
  if(rule?.limit&&amount>rule.limit)alerts.push(`Above your limit by ${(amount-rule.limit)/100} ${currency}`);
  if(baselineMonths.length>=3&&average>0&&(alignedCurrent.categories.get(category)||0)>average*(1+(rule?.percent??25)/100))alerts.push(`Above the recorded ${baselineMonths.length}-month category average by more than ${rule?.percent??25}%`);
  return{category,amount,budget:allocated,remaining:allocated===null?null:allocated-amount,share:current.spent>0?amount/current.spent*100:null,current:a,comparison:b,delta:a-b,percent:b>0?(a-b)/b*100:null,average,alerts};
 }).sort((a,b)=>b.amount-a.amount||a.category.localeCompare(b.category));
 const merchantKeys=new Set([...left.merchants.keys(),...right.merchants.keys()]);
 const drivers=[...merchantKeys].map(key=>({name:(left.merchants.get(key)||right.merchants.get(key)).name,current:left.merchants.get(key)?.amount||0,comparison:right.merchants.get(key)?.amount||0,delta:(left.merchants.get(key)?.amount||0)-(right.merchants.get(key)?.amount||0)})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||a.name.localeCompare(b.name));
 return{period,current,left,right,matchedDays,trendDays,trend,baselineMonths:baselineMonths.length,baselineRequested:baseline,baselineAverage,categories,drivers,currency,mode,alignment};
}
export function discountEvents(ledger,today=isoDate()){
 const originals=new Map(ledger.transactions.map(t=>[t.id,t])),returned=new Map(),events=[];
 const rounded=(n,d)=>Number((n+BigInt(d)/2n)/BigInt(d));
 for(const t of [...ledger.transactions].filter(t=>t.date<=today).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
  if(t.kind==='expense'&&t.discount>0)events.push({...t,originalId:t.id});
  if(t.kind==='refund'&&(t.refundKind||'refund')==='refund'){
   const original=originals.get(t.originalId);if(!original?.discount)continue;
   const before=returned.get(original.id)||0,after=before+t.amount;returned.set(original.id,after);
   const delta=rounded(BigInt(after)*BigInt(original.discount),original.amount)-rounded(BigInt(before)*BigInt(original.discount),original.amount);
   if(delta)events.push({...original,id:t.id,date:t.date,discount:-delta,originalId:original.id,adjustment:true});
  }
 }
 return events;
}
export function savingsReport(ledger,currency,start,end,today=isoDate()){
 const accountCurrency=new Map(ledger.accounts.map(a=>[a.id,a.currency]));
 const expenses=ledger.transactions.filter(t=>t.kind==='expense'&&t.date>=start&&t.date<end&&t.date<=today&&accountCurrency.get(t.account)===currency);
 const discounts=discountEvents(ledger,today).filter(t=>t.date>=start&&t.date<end&&accountCurrency.get(t.account)===currency),byType=new Map(),byCategory=new Map(),byMerchant=new Map();
 for(const t of discounts){for(const [map,key] of [[byType,t.discountType||'other'],[byCategory,t.category],[byMerchant,(t.merchant||'').trim()||'No merchant recorded']])map.set(key,(map.get(key)||0)+t.discount);}
 const receipts=ledger.transactions.filter(t=>t.kind==='income'&&t.cashbackId&&t.date>=start&&t.date<end&&t.date<=today&&accountCurrency.get(t.account)===currency);
 const trackers=(ledger.cashbacks||[]).filter(c=>c.currency===currency).map(c=>{const received=ledger.transactions.filter(t=>t.kind==='income'&&t.cashbackId===c.id&&t.date<=today).reduce((n,t)=>n+t.amount,0);return{...c,received,pending:Math.max(0,c.expected-received)};});
 return{discounts,totalDiscounts:discounts.reduce((n,t)=>n+t.discount,0),cashbackReceived:receipts.reduce((n,t)=>n+t.amount,0),receipts,trackers,byType,byCategory,byMerchant};
}
// Allocate linked returns proportionally across all original purchase portions,
// including the everyday remainder. Largest remainders conserve every minor unit.
export function returnAllocations(original,returned){
 const parts=(original.tripAllocations||[]).map(a=>({tripId:a.tripId,amount:a.amount}));
 const used=parts.reduce((n,a)=>n+a.amount,0);parts.push({tripId:'',amount:original.amount-used});
 const rows=parts.map((p,i)=>({...p,index:i,value:Number(BigInt(returned)*BigInt(p.amount)/BigInt(original.amount)),remainder:BigInt(returned)*BigInt(p.amount)%BigInt(original.amount)}));
 let missing=returned-rows.reduce((n,p)=>n+p.value,0);
 for(const r of [...rows].sort((a,b)=>a.remainder===b.remainder?a.index-b.index:a.remainder>b.remainder?-1:1)){if(missing--<=0)break;r.value++;}
 return rows.filter(r=>r.tripId);
}
export function tripReport(ledger,tripId,today=isoDate()){
 const trip=(ledger.trips||[]).find(t=>t.id===tripId);if(!trip)return null;
 const result={EUR:{paid:0,ownShare:0,refunds:0,reimbursements:0,discounts:0,netPaid:0,remaining:0,outstanding:0,categories:new Map()},INR:{paid:0,ownShare:0,refunds:0,reimbursements:0,discounts:0,netPaid:0,remaining:0,outstanding:0,categories:new Map()}};
 const accounts=new Map(ledger.accounts.map(a=>[a.id,a])),originals=new Map(ledger.transactions.map(t=>[t.id,t])),cumulativeReturns=new Map();const entries=[];
 for(const t of [...ledger.transactions].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){if(t.date>today)continue;const c=accounts.get(t.account)?.currency;if(!result[c])continue;
  if(t.kind==='expense'){const allocation=(t.tripAllocations||[]).find(a=>a.tripId===tripId);if(!allocation)continue;
   const r=result[c];r.paid+=allocation.amount;r.ownShare+=allocation.ownShare;
   const discount=t.discount?returnAllocations(t,t.discount).find(a=>a.tripId===tripId)?.value||0:0;r.discounts+=discount;
   r.categories.set(t.category,(r.categories.get(t.category)||0)+allocation.amount);
   entries.push({...t,currency:c,allocated:allocation.amount,ownShare:allocation.ownShare,phase:t.date<trip.start?'Before departure':t.date>trip.end?'After return':'During trip'});
  }else if(t.kind==='refund'){const original=originals.get(t.originalId);if(!original)continue;const before=cumulativeReturns.get(original.id)||0,after=before+t.amount;cumulativeReturns.set(original.id,after);const amount=(returnAllocations(original,after).find(a=>a.tripId===tripId)?.value||0)-(returnAllocations(original,before).find(a=>a.tripId===tripId)?.value||0);if(!amount)continue;
   const kind=t.refundKind==='reimbursement'?'reimbursements':'refunds';result[c][kind]+=amount;result[c].categories.set(t.category,(result[c].categories.get(t.category)||0)-amount);entries.push({...t,currency:c,allocated:-amount,phase:t.date<trip.start?'Before departure':t.date>trip.end?'After return':'During trip'});
  }
 }
 const outstanding={EUR:0,INR:0};for(const r of ledger.receivables||[]){const original=originals.get(r.originalId);if(!original)continue;const c=accounts.get(original.account)?.currency;if(!result[c])continue;const received=ledger.transactions.filter(t=>t.kind==='refund'&&t.originalId===r.originalId&&(t.refundKind||'refund')===(r.returnKind||'reimbursement')&&t.date<=today).reduce((n,t)=>n+t.amount,0);outstanding[c]+=returnAllocations(original,Math.max(0,r.expected-received)).find(a=>a.tripId===tripId)?.value||0;}
 for(const c of ['EUR','INR']){result[c].netPaid=result[c].paid-result[c].refunds-result[c].reimbursements;result[c].remaining=trip.budgets[c]-result[c].netPaid;result[c].outstanding=outstanding[c];}
 // The optional summary uses one explicitly entered reporting rate, not market FX.
 const converted=trip.eurToInr?{currency:'EUR',rate:trip.eurToInr,netPaid:result.EUR.netPaid+Math.round(result.INR.netPaid/trip.eurToInr),budget:trip.budgets.EUR+Math.round(trip.budgets.INR/trip.eurToInr)}:null;
 const reversedDiscounts=new Map();for(const event of discountEvents(ledger,today).filter(t=>t.adjustment))reversedDiscounts.set(event.originalId,(reversedDiscounts.get(event.originalId)||0)-event.discount);for(const [originalId,value] of reversedDiscounts){const original=originals.get(originalId),c=accounts.get(original?.account)?.currency;if(result[c]&&original)result[c].discounts-=returnAllocations(original,value).find(a=>a.tripId===tripId)?.value||0;}
 return{trip,currencies:result,entries:entries.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)),converted};
}
export function billFunding(bill,today=isoDate()){
 const dueMonth=bill.due.slice(0,7),now=today.slice(0,7);
 const slots=bill.due<today?0:(Number(dueMonth.slice(0,4))-Number(now.slice(0,4)))*12+Number(dueMonth.slice(5))-Number(now.slice(5))+1;
 const remaining=Math.max(0,bill.target-bill.saved);
 return{remaining,slots,monthly:slots?Math.ceil(remaining/slots):null,overdue:bill.due<today};
}
export function updateRecurringPrice(previous,next,currency,today=isoDate()){
 const history=[...(previous?.priceHistory||[])];
 if(previous?.id&&(previous.amount!==next.amount||previous.frequency!==next.frequency))history.push({date:today,currency,previousAmount:previous.amount,amount:next.amount,previousFrequency:previous.frequency,frequency:next.frequency});
 return{...next,priceHistory:history};
}
export function priceAnnualChange(change){return annualizedCost(change)-annualizedCost({amount:change.previousAmount,frequency:change.previousFrequency});}
