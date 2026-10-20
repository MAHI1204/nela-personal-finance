import {useState} from 'react';
import {Field} from './ui';
import {amountToMinor} from '../lib/finance.mjs';
import {field} from './report-utils';
type Any=any;
export function readTransactionDetails(f:FormData,kind:string,amount:number){
 const details:Any={subcategory:field(f,'subcategory'),necessity:field(f,'necessity')||'unclassified',spendingType:field(f,'spendingType')||'unclassified',discount:0,referencePrice:undefined,discountType:field(f,'discountType')||'other',tripAllocations:[]};
 if(kind!=='expense')return details;
 const raw=field(f,'discount'),ref=field(f,'referencePrice');
 if(ref){details.referencePrice=amountToMinor(ref);if(details.referencePrice<amount)throw Error('Reference price cannot be less than the amount paid.');details.discount=details.referencePrice-amount;if(raw&&amountToMinor(raw)!==details.discount)throw Error('Discount must equal reference price minus actual amount paid.');}else details.discount=raw?amountToMinor(raw):0;
 if(details.discount<0)throw Error('Discount must not be negative.');
 const tripIds=f.getAll('tripId'),allocated=f.getAll('tripAmount'),own=f.getAll('tripOwnShare');
 details.tripAllocations=tripIds.map((tripId,i)=>{const tripAmount=String(allocated[i]||'').trim(),ownShare=String(own[i]||'').trim();if(!tripId){if(tripAmount||ownShare)throw Error('Choose a trip for each filled allocation.');return null;}const a=amountToMinor(tripAmount);return{tripId:String(tripId),amount:a,ownShare:ownShare?amountToMinor(ownShare):a};}).filter(Boolean);
 return details;
}
export default function TransactionDetails({transaction={},trips=[],kind}:Any){
 const [rows,setRows]=useState<Any[]>(()=>transaction.tripAllocations?.length?transaction.tripAllocations.map((a:Any)=>({...a,key:a.tripId})):[]);
 return kind==='expense'?<details><summary>Optional: subcategory, discounts and trip splits</summary>
 <Field label="Subcategory (optional)"><input name="subcategory" maxLength={100} defaultValue={transaction.subcategory||''} placeholder="e.g. Coffee"/></Field>
 <div className="form-grid"><Field label="Essential or optional?"><select name="necessity" defaultValue={transaction.necessity||'unclassified'}><option value="unclassified">Not classified</option><option value="essential">Essential</option><option value="optional">Optional</option></select></Field><Field label="Spending pattern"><select name="spendingType" defaultValue={transaction.spendingType||(transaction.recurringId?'recurring':'unclassified')}><option value="unclassified">Not classified</option><option value="recurring">Recurring</option><option value="one-time">One-time</option></select></Field></div>
 <h3>Discount on this purchase</h3><p className="subtle">Amount above is what you actually paid. Enter a discount directly, or a reference price to calculate it. If you enter both, they must agree. The reference price is your record, not verified market savings.</p>
 <div className="form-grid"><Field label="Discount amount (optional)"><input name="discount" inputMode="decimal" defaultValue={transaction.discount?transaction.discount/100:''}/></Field><Field label="Reference price (optional)"><input name="referencePrice" inputMode="decimal" defaultValue={transaction.referencePrice===undefined?'':transaction.referencePrice/100}/></Field></div>
 <Field label="Discount type"><select name="discountType" defaultValue={transaction.discountType||'other'}><option value="coupon">Coupon</option><option value="sale">Sale / discount</option><option value="loyalty">Loyalty reward</option><option value="other">Other</option></select></Field>
 <h3>Allocate to trips</h3><p className="subtle">Allocate all or part of this purchase. The remainder stays ordinary spending. Your share can be smaller than what you paid for a shared purchase; leave it empty to use the full allocated amount. These are labels on one transaction, not additional expenses.</p>
 {rows.map((r,i)=><div className="allocation-row" key={r.key}><Field label="Trip"><select name="tripId" defaultValue={r.tripId||''}><option value="">Choose a trip</option>{trips.map((t:Any)=><option key={t.id} value={t.id}>{t.name}{t.archived?' (archived)':''}</option>)}</select></Field><div className="form-grid"><Field label="Amount allocated"><input name="tripAmount" inputMode="decimal" defaultValue={r.amount?r.amount/100:''}/></Field><Field label="Your share"><input name="tripOwnShare" inputMode="decimal" defaultValue={r.ownShare===undefined?'':r.ownShare/100}/></Field></div><button type="button" className="text-btn" onClick={()=>setRows(rows.filter((_,j)=>j!==i))}>Remove allocation</button></div>)}
 <button type="button" className="button compact" disabled={!trips.length||rows.length>=30} onClick={()=>setRows([...rows,{key:crypto.randomUUID()}])}>Add trip allocation</button>{!trips.length&&<p className="subtle">Create a trip in Trips & reports first.</p>}
 </details>:<><input type="hidden" name="subcategory" value={transaction.subcategory||''}/><input type="hidden" name="necessity" value={transaction.necessity||'unclassified'}/><input type="hidden" name="spendingType" value={transaction.spendingType||'unclassified'}/></>;
}
