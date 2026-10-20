import {isoDate,periodFor,periodTotals} from './finance.mjs';
import {dayAfter} from './monthly.mjs';
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);

// All boundaries are date-only, end-exclusive. Compare the same number of days,
// capped to the shorter cycle. Future entries and schedules are not actuals.
export function spendingAnalysis(ledger,currency,date,today=isoDate()){
  const period=periodFor(date,ledger.settings.cycleDay);
  const previous=periodFor(dayAfter(period.start,-1),ledger.settings.cycleDay);
  const end=today<period.start?period.start:today<period.end?dayAfter(today):period.end;
  const actual=periodTotals(ledger,currency,period.start,end);
  const elapsed=daysBetween(period.start,end);
  const matchedDays=Math.min(elapsed,daysBetween(previous.start,previous.end));
  const currentEnd=dayAfter(period.start,matchedDays),priorEnd=dayAfter(previous.start,matchedDays);
  const current=periodTotals(ledger,currency,period.start,currentEnd);
  const prior=periodTotals(ledger,currency,previous.start,priorEnd);
  const expenses=actual.transactions.filter(t=>t.kind==='expense');
  const gross=expenses.reduce((n,t)=>n+t.amount,0);
  const returned=actual.transactions.filter(t=>t.kind==='refund').reduce((n,t)=>n+t.amount,0);
  const merchants=new Map();
  for(const t of expenses){
    const name=(t.merchant||'').trim(),key=name?name.toLocaleLowerCase():'';
    const row=merchants.get(key)||{key,name:name||'No merchant recorded',amount:0,count:0,transactions:[]};
    row.amount+=t.amount;row.count++;row.transactions.push(t);merchants.set(key,row);
  }
  const categories=[...new Set([...Object.keys(current.categories),...Object.keys(prior.categories)])].map(category=>({category,current:current.categories[category]||0,prior:prior.categories[category]||0,delta:(current.categories[category]||0)-(prior.categories[category]||0)})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||a.category.localeCompare(b.category));
  return{period,previous,end,elapsed,matchedDays,currentEnd,priorEnd,current,prior,actual,gross,returned,net:actual.spent,income:actual.income,surplus:actual.income-actual.spent,average:elapsed?Math.round(gross/elapsed):null,delta:current.spent-prior.spent,percent:prior.spent>0?(current.spent-prior.spent)/prior.spent*100:null,merchants:[...merchants.values()].sort((a,b)=>b.amount-a.amount||a.name.localeCompare(b.name)),categories};
}
