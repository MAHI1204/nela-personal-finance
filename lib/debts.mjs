import {balances,isoDate} from './finance.mjs';

// Debt principal is cash movement, never salary or consumption.
export function debtTransactions(ledger){
 const out=[];
 for(const d of ledger.debts||[]){
  const base={date:d.date,account:d.account,merchant:d.person,note:d.note||'',debtId:d.id,category:'Personal lending'};
  if(d.origin!=='opening')out.push({...base,id:`debt:${d.id}`,kind:d.direction==='owe'?'debt-in':'debt-out',amount:d.amount});
  if(d.origin==='paid-for'&&d.ownShare>0)out.push({...base,id:`share:${d.id}`,kind:'expense',amount:d.ownShare,category:d.category});
 }
 for(const p of ledger.debtPayments||[]){
  const d=ledger.debts.find(d=>d.id===p.debtId);if(!d)continue;
  out.push({id:`payment:${p.id}`,date:p.date,account:p.account,kind:d.direction==='owe'?'debt-out':'debt-in',amount:p.amount,merchant:d.person,note:p.note||'',category:'Personal lending',debtId:d.id,debtPaymentId:p.id});
 }
 return out;
}
export function rebuildDebtTransactions(ledger){return {...ledger,transactions:[...ledger.transactions.filter(t=>!t.debtId),...debtTransactions(ledger)]};}
export function debtSummary(ledger,currency,through=isoDate()){
 const rows=(ledger.debts||[]).filter(d=>d.currency===currency&&d.date<=through).map(d=>{const payments=(ledger.debtPayments||[]).filter(p=>p.debtId===d.id&&p.date<=through);const repaid=payments.reduce((n,p)=>n+p.amount,0);const adjustments=(ledger.debtAdjustments||[]).filter(x=>x.debtId===d.id&&x.date<=through),adjusted=adjustments.reduce((n,x)=>n+x.amount,0);return {...d,payments,repaid,adjustments,adjusted,remaining:d.amount-repaid-adjusted};});
 return {rows,owe:rows.filter(d=>d.direction==='owe').reduce((n,d)=>n+d.remaining,0),owed:rows.filter(d=>d.direction==='owed').reduce((n,d)=>n+d.remaining,0)};
}
export function creditSummary(ledger,cardId,through=isoDate()){
 const card=ledger.accounts.find(a=>a.id===cardId),balance=balances(ledger,through)[cardId]||0;
 const statement=(ledger.cardStatements||[]).filter(s=>s.account===cardId&&s.closing<=through).sort((a,b)=>b.closing.localeCompare(a.closing))[0];
 const after=statement?ledger.transactions.filter(t=>t.date>statement.closing&&t.date<=through):[];
 const credits=after.reduce((n,t)=>n+((t.account===cardId&&['income','refund','debt-in'].includes(t.kind))?t.amount:(t.kind==='transfer'&&t.toAccount===cardId)?t.toAmount:0),0);
 const unbilled=statement?after.reduce((n,t)=>n+(t.account===cardId&&['expense','debt-out','transfer'].includes(t.kind)?t.amount:0),0):null;
 return {card,balance,outstanding:Math.max(0,-balance),creditBalance:Math.max(0,balance),available:card?.limit===undefined?null:Math.max(0,card.limit+balance),statement,statementRemaining:statement?Math.max(0,statement.amount-credits):null,unbilled};
}
export function debtPeriod(ledger,currency,start,end,through){

 const payments=(ledger.debtPayments||[]).filter(p=>p.date>=start&&p.date<end&&p.date<=through&&ledger.debts?.some(d=>d.id===p.debtId&&d.currency===currency));
 const debts=(ledger.debts||[]).filter(d=>d.currency===currency&&d.date>=start&&d.date<end&&d.date<=through);
 return {...debtSummary(ledger,currency,through),debts,payments,settled:payments.reduce((n,p)=>n+p.amount,0),borrowed:debts.filter(d=>d.origin!=='opening'&&d.direction==='owe').reduce((n,d)=>n+d.amount,0),lent:debts.filter(d=>d.origin!=='opening'&&d.direction==='owed').reduce((n,d)=>n+d.amount,0)};
}
