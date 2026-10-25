import {balances,isoDate} from './finance.mjs';

export function cardCredit(ledger,t,cardId){
 if(t.kind==='transfer'&&t.toAccount===cardId)return t.toAmount;
 if(t.account===cardId&&['income','refund','debt-in'].includes(t.kind))return t.amount;
 return 0;
}
export function statementDetails(ledger,statementId,through=isoDate(),visiting=new Set()){
 const statement=(ledger.cardStatements||[]).find(x=>x.id===statementId);
 if(!statement||visiting.has(statementId))return null;
 visiting=new Set(visiting);visiting.add(statementId);
 const transactions=new Map(ledger.transactions.map(t=>[t.id,t]));
 const allocations=(ledger.cardAllocations||[]).filter(a=>a.statementId===statementId&&transactions.get(a.transactionId)?.date<=through);
 const applied=allocations.reduce((n,a)=>n+a.amount,0);
 const carried=statement.carriedFrom?statementDetails(ledger,statement.carriedFrom,through,visiting):null;
 const ownAmount=statement.amount-(statement.carriedAmount||0),ownRemaining=Math.max(0,ownAmount-applied);
 const carriedRemaining=carried?Math.min(statement.carriedAmount||0,carried.remaining):0;
 const remaining=ownRemaining+carriedRemaining;
 const allAllocations=[...allocations,...(carried?.allAllocations||[])];
 const billPaid=allAllocations.filter(a=>{const t=transactions.get(a.transactionId);return t?.kind==='transfer'&&t.date>=statement.closing;}).reduce((n,a)=>n+a.amount,0);
 return {statement,ownAmount,ownRemaining,applied,paid:billPaid,carriedRemaining,remaining,allocations,allAllocations,status:remaining===0?'Paid':remaining<statement.amount?'Partially paid':'Unpaid'};
}
export function allocateBill(ledger,statementId,amount,through=isoDate()){
 const chain=[],seen=new Set();let current=(ledger.cardStatements||[]).find(s=>s.id===statementId);
 while(current&&!seen.has(current.id)){seen.add(current.id);chain.unshift(current);current=ledger.cardStatements.find(s=>s.id===current.carriedFrom);}
 const allocations=[];let left=amount;
 for(const s of chain){const d=statementDetails(ledger,s.id,through);if(!d||s.closing>through)continue;const value=Math.min(left,d.ownRemaining);if(value>0){allocations.push({statementId:s.id,amount:value});left-=value;}}
 return {allocations,unallocated:left};
}
export function cardCredits(ledger,cardId,through=isoDate(),excludeIds=[]){
 return ledger.transactions.filter(t=>t.date<=through&&cardCredit(ledger,t,cardId)>0).map(t=>{const used=(ledger.cardAllocations||[]).filter(a=>a.transactionId===t.id&&!excludeIds.includes(a.id)).reduce((n,a)=>n+a.amount,0);return {transaction:t,amount:cardCredit(ledger,t,cardId),allocated:used,unallocated:cardCredit(ledger,t,cardId)-used};});
}
export function creditSummary(ledger,cardId,through=isoDate()){
 const card=ledger.accounts.find(a=>a.id===cardId),balance=balances(ledger,through)[cardId]||0;
 const statements=(ledger.cardStatements||[]).filter(s=>s.account===cardId&&s.closing<=through).sort((a,b)=>b.closing.localeCompare(a.closing));
 const statement=statements[0],details=statement?statementDetails(ledger,statement.id,through):null;
 const after=statement?ledger.transactions.filter(t=>t.date>statement.closing&&t.date<=through):[];
 const unbilled=statement?after.reduce((n,t)=>n+(t.account===cardId&&['expense','debt-out','transfer'].includes(t.kind)?t.amount:0),0):null;
 const credits=cardCredits(ledger,cardId,through);
 return {card,balance,outstanding:Math.max(0,-balance),creditBalance:Math.max(0,balance),available:card?.limit===undefined?null:Math.max(0,card.limit+balance),statement,statementRemaining:details?.remaining??null,unbilled,statements:statements.map(s=>statementDetails(ledger,s.id,through)),unallocatedCredits:credits.reduce((n,c)=>n+c.unallocated,0),credits};
}

export function recordBillPayment(ledger,{id,statementId,account,date,amount,note=''}){
 const statement=ledger.cardStatements.find(s=>s.id===statementId),from=ledger.accounts.find(a=>a.id===account),card=ledger.accounts.find(a=>a.id===statement?.account);
 if(!statement||!from||from.kind==='credit'||!card||card.kind!=='credit'||from.currency!==card.currency||date<statement.closing||amount<=0||!Number.isInteger(amount))throw Error('Choose a bill, a cash account in its currency, a payment date on or after closing, and a positive amount.');
 if(ledger.transactions.some(t=>t.id===id))throw Error('This payment is already recorded. Review existing card credits.');
 const split=allocateBill(ledger,statementId,amount,date);
 const transaction={id,date,kind:'transfer',account,toAccount:card.id,amount,toAmount:amount,category:'Transfer',merchant:'',note:note||`Monthly bill payment · ${card.name} · ${statement.closing}`};
 return {...ledger,transactions:[...ledger.transactions,transaction],cardAllocations:[...(ledger.cardAllocations||[]),...split.allocations.map((a,i)=>({...a,id:`${id}:allocation:${i}`,transactionId:id}))]};
}
