import {useState} from 'react';
import {Modal,Field} from './ui';
import {isoDate,amountToMinor} from '../lib/finance.mjs';
import {allocateBill,statementDetails,recordBillPayment,billPaymentAmount} from '../lib/cards.mjs';
import {money,field,clone} from './report-utils';
type Any=any;
export function BillPaymentModal({ledger:s,card,initialStatement,save,notify,busy,onClose}:Any){
 const [id]=useState(()=>crypto.randomUUID()),[statementId,setStatementId]=useState(initialStatement||''),[choice,setChoice]=useState('full'),[custom,setCustom]=useState(''),[date,setDate]=useState(isoDate());
 const st=s.cardStatements.find((x:Any)=>x.id===statementId),details=st?statementDetails(s,st.id,date):null;
 let amount=billPaymentAmount(s,statementId,choice,date);
 if(choice==='custom'){try{amount=amountToMinor(custom);}catch{amount=0;}}
 const split=allocateBill(s,statementId,Math.max(0,amount),date);
 return <Modal title="Pay monthly bill" submit="Record bill payment" busy={busy} onClose={onClose} onSubmit={async(e:Any)=>{e.preventDefault();try{const f=new FormData(e.currentTarget),actualDate=field(f,'date'),actualAmount=billPaymentAmount(s,statementId,choice,actualDate,choice==='custom'?amountToMinor(custom):0);await save(recordBillPayment(s,{id,statementId,account:field(f,'account'),date:actualDate,amount:actualAmount,note:field(f,'note')}));notify('Bill payment recorded once and allocated to its statement');onClose();}catch(err){notify((err as Error).message);}}}>
 <Field label="Bill / statement"><select required value={statementId} onChange={e=>setStatementId(e.target.value)}><option value="">Choose a statement</option>{s.cardStatements.filter((x:Any)=>x.account===card.id&&x.closing<=isoDate()).sort((a:Any,b:Any)=>a.closing.localeCompare(b.closing)).map((x:Any)=><option key={x.id} value={x.id}>Closed {x.closing} · Due {x.due} · {money(statementDetails(s,x.id)?.remaining||0,card.currency)} remaining</option>)}</select></Field>
 {st&&<><div className="line"><span>Original statement amount</span><strong>{money(st.amount,card.currency)}</strong></div><div className="line"><span>Payments / credits applied</span><strong>{money(st.amount-details!.remaining,card.currency)}</strong></div><div className="line"><span>Remaining on payment date</span><strong>{money(details!.remaining,card.currency)}</strong></div></>}
 <Field label="Payment choice"><select value={choice} onChange={e=>setChoice(e.target.value)}><option value="full">Full remaining bill</option><option value="minimum">Minimum remaining (tracked estimate)</option><option value="custom">Custom / partial payment</option></select></Field>
 {choice==='custom'&&<Field label={`Amount paid · ${card.currency}`}><input required inputMode="decimal" value={custom} onChange={e=>setCustom(e.target.value)}/></Field>}
 <p><strong>Record {money(amount,card.currency)}</strong></p><Field label="Paid from"><select name="account" required><option value="">Choose account</option>{s.accounts.filter((a:Any)=>a.kind!=='credit'&&a.currency===card.currency).map((a:Any)=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
 <Field label="Actual payment date"><input name="date" type="date" required min={st?.closing} max={isoDate()} value={date} onInput={e=>setDate(e.currentTarget.value)} onChange={e=>setDate(e.target.value)}/></Field><Field label="Payment reference / note"><input name="note" maxLength={500}/></Field>
 <h3>Allocation of this payment</h3>{split.allocations.map((a:Any)=><div className="line" key={a.statementId}><span>Statement closed {s.cardStatements.find((x:Any)=>x.id===a.statementId)?.closing}</span><strong>{money(a.amount,card.currency)}</strong></div>)}{split.unallocated>0&&<p className="subtle">{money(split.unallocated,card.currency)} stays unallocated as a card credit. It is not automatically applied to a future bill.</p>}
 <p className="subtle">This records a payment already made; it does not send money. Carried balances are allocated to the earlier bill first. Check your issuer’s minimum requirement; refunds and issuer allocation rules may differ. If this payment already appears in Transactions, cancel and use “Allocate existing credit” instead.</p>
 </Modal>;
}
export function CardAllocationModal({ledger:s,card,source,save,notify,busy,onClose,openEntry}:Any){
 const existing=s.cardAllocations.filter((a:Any)=>a.transactionId===source.id);
 const [amounts,setAmounts]=useState<Record<string,string>>(()=>Object.fromEntries(existing.map((a:Any)=>[a.statementId,String(a.amount/100)])));
 const base={...s,cardAllocations:s.cardAllocations.filter((a:Any)=>a.transactionId!==source.id)};
 const available=source.kind==='transfer'?source.toAmount:source.amount;
 const bills=s.cardStatements.filter((x:Any)=>x.account===card.id&&x.closing<=source.date).sort((a:Any,b:Any)=>a.closing.localeCompare(b.closing));
 let total=0;try{total=Object.values(amounts).reduce((n,v)=>n+(v?amountToMinor(v):0),0);}catch{total=0;}
 return <Modal title="Allocate an existing payment or refund" busy={busy} onClose={onClose} onSubmit={async(e:Any)=>{e.preventDefault();try{const next=clone(base);for(const [statementId,value] of Object.entries(amounts)){const amount=value?amountToMinor(value):0;if(amount<0)throw Error('Allocation cannot be negative.');if(amount>0)next.cardAllocations.push({id:crypto.randomUUID(),transactionId:source.id,statementId,amount});}await save(next);notify('Allocations saved; no new account movement created');onClose();}catch(err){notify((err as Error).message);}}}>
 <p>{source.date} · {source.kind==='transfer'?'Recorded card payment':'Recorded card credit / refund'} · <strong>{money(available,card.currency)}</strong></p>
 {bills.map((st:Any)=>{const d=statementDetails(base,st.id)!;return <Field key={st.id} label={`Statement closed ${st.closing} · new billed portion remaining ${money(d.ownRemaining,card.currency)}`} hint={st.carriedFrom?'Allocate its carried amount to the earlier statement below, once.':undefined}><input inputMode="decimal" value={amounts[st.id]||''} onChange={e=>setAmounts({...amounts,[st.id]:e.target.value})} placeholder="0.00"/></Field>;})}
 {!bills.length&&<p>No statement had closed by this credit date. Leave it unallocated or add the appropriate earlier statement first.</p>}
 <div className="line"><span>Allocated</span><strong>{money(total,card.currency)}</strong></div><div className="line"><span>Unallocated credit</span><strong>{money(available-total,card.currency)}</strong></div><p className="subtle">This changes bill allocation only. Set all amounts to zero and save to unlink this credit before editing or deleting its underlying transaction. A refund reduces cash debt immediately but settles a bill only when allocated here. Changing older allocations may require temporarily removing a later statement’s carry-forward link.</p>
 <button type="button" className="button compact" disabled={existing.length>0} onClick={()=>{onClose();openEntry(source);}}>Edit underlying transaction</button>
 </Modal>;
}
