import {balances,isoDate} from './finance.mjs';

// Debt principal is cash movement, never salary or consumption.
export function debtTransactions(ledger){
 const out=[];
 for(const d of ledger.debts||[]){
  const base={date:d.date,account:d.account,merchant:d.person,note:d.note||'',debtId:d.id,category:'Personal lending'};
  if(d.origin!=='opening')out.push({...base,id:`debt:${d.id}`,kind:d.direction==='owe'?'debt-in':'debt-out',amount:d.amount});
  if(d.origin==='paid-for'&&d.ownShare>0)out.push({...base,id:`share:${d.id}`,kind:'expense',amount:d.ownShare,category:d.category});
 }
 const batches=new Map();
 for(const p of ledger.debtPayments||[]){const key=p.batchId?'batch:'+p.batchId:'single:'+p.id;const rows=batches.get(key)||[];rows.push(p);batches.set(key,rows);}
 for(const rows of batches.values()){
  const p=rows[0],d=ledger.debts.find(d=>d.id===p.debtId);if(!d)continue;
  out.push({id:p.batchId?`paymentgroup:${p.batchId}`:`payment:${p.id}`,date:p.date,account:p.account,kind:d.direction==='owe'?'debt-out':'debt-in',amount:rows.reduce((n,p)=>n+p.amount,0),merchant:d.person,note:p.note||'',category:'Personal lending',debtId:d.id,debtPaymentId:p.id,...(p.batchId?{debtBatchId:p.batchId}:{})});
 }
 return out;
}
export function rebuildDebtTransactions(ledger){return {...ledger,transactions:[...ledger.transactions.filter(t=>!t.debtId),...debtTransactions(ledger)]};}
export function debtSummary(ledger,currency,through=isoDate()){
 const rows=(ledger.debts||[]).filter(d=>d.currency===currency&&d.date<=through).map(d=>{const payments=(ledger.debtPayments||[]).filter(p=>p.debtId===d.id&&p.date<=through);const repaid=payments.reduce((n,p)=>n+p.amount,0);const adjustments=(ledger.debtAdjustments||[]).filter(x=>x.debtId===d.id&&x.date<=through),adjusted=adjustments.reduce((n,x)=>n+x.amount,0);return {...d,payments,repaid,adjustments,adjusted,remaining:d.amount-repaid-adjusted};});
 return {rows,owe:rows.filter(d=>d.direction==='owe').reduce((n,d)=>n+d.remaining,0),owed:rows.filter(d=>d.direction==='owed').reduce((n,d)=>n+d.remaining,0)};
}
export {creditSummary} from './cards.mjs';
export function debtPeriod(ledger,currency,start,end,through,person){
 if(person)ledger={...ledger,debts:(ledger.debts||[]).filter(d=>d.person===person)};

 const payments=(ledger.debtPayments||[]).filter(p=>p.date>=start&&p.date<end&&p.date<=through&&ledger.debts?.some(d=>d.id===p.debtId&&d.currency===currency));
 const debts=(ledger.debts||[]).filter(d=>d.currency===currency&&d.date>=start&&d.date<end&&d.date<=through);
 const closing=debtSummary(ledger,currency,through),previous=new Date(start+'T12:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);const openingThrough=previous.toISOString().slice(0,10)<through?previous.toISOString().slice(0,10):through,opening=debtSummary(ledger,currency,openingThrough);
 const adjustments=(ledger.debtAdjustments||[]).filter(x=>x.date>=start&&x.date<end&&x.date<=through);
 const rollforward=['owe','owed'].map(direction=>{const ids=new Set((ledger.debts||[]).filter(d=>d.currency===currency&&d.direction===direction).map(d=>d.id));return {direction,opening:direction==='owe'?opening.owe:opening.owed,newPrincipal:debts.filter(d=>d.direction===direction&&d.origin!=='opening').reduce((n,d)=>n+d.amount,0),existingAdded:debts.filter(d=>d.direction===direction&&d.origin==='opening').reduce((n,d)=>n+d.amount,0),repaid:payments.filter(p=>ids.has(p.debtId)).reduce((n,p)=>n+p.amount,0),adjusted:adjustments.filter(x=>ids.has(x.debtId)).reduce((n,x)=>n+x.amount,0),closing:direction==='owe'?closing.owe:closing.owed};});
 return {...closing,rollforward,openingThrough,debts,payments,settled:payments.reduce((n,p)=>n+p.amount,0),borrowed:debts.filter(d=>d.origin!=='opening'&&d.direction==='owe').reduce((n,d)=>n+d.amount,0),lent:debts.filter(d=>d.origin!=='opening'&&d.direction==='owed').reduce((n,d)=>n+d.amount,0)};
}

export function combinedRepaymentCandidates(ledger,{person,currency,direction,date,batchId}){
 const base={...ledger,debtPayments:(ledger.debtPayments||[]).filter(p=>!batchId||p.batchId!==batchId)};
 return debtSummary(base,currency,date).rows.filter(d=>d.person===person&&d.direction===direction&&d.remaining>0).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function recordCombinedRepayment(ledger,{batchId,person,currency,direction,date,account,amount,note='',allocations}){
 const base={...ledger,debtPayments:ledger.debtPayments.filter(p=>p.batchId!==batchId)};
 const candidates=combinedRepaymentCandidates(base,{person,currency,direction,date}),byId=new Map(candidates.map(d=>[d.id,d]));
 const a=ledger.accounts.find(a=>a.id===account);
 if(!a||a.kind==='credit'||a.currency!==currency||!Number.isInteger(amount)||amount<=0)throw Error('Choose a bank, cash or savings account in the repayment currency and a positive amount.');
 if(new Set(allocations.map(x=>x.debtId)).size!==allocations.length||!allocations.length||allocations.reduce((n,x)=>n+x.amount,0)!==amount)throw Error('Allocate the actual payment exactly once across the selected records.');
 for(const x of allocations)if(!byId.has(x.debtId)||!Number.isInteger(x.amount)||x.amount<=0||x.amount>byId.get(x.debtId).remaining)throw Error('Each allocation must fit an outstanding record for this person, direction, currency and payment date.');
 const rows=allocations.map((x,i)=>({id:`${batchId}:${i}`,batchId,debtId:x.debtId,date,account,amount:x.amount,note}));
 return rebuildDebtTransactions({...base,debtPayments:[...base.debtPayments,...rows]});
}
