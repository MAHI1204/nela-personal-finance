import {creditSummary,debtSummary} from '../lib/debts.mjs';
import {money} from './report-utils';
type Any=any;
export default function ObligationDates({ledger:s,currency,start,end}:Any){
 const debts=debtSummary(s,currency).rows.filter((d:Any)=>d.remaining>0&&d.due&&d.due>=start&&d.due<end);
 const cards=s.accounts.filter((a:Any)=>a.kind==='credit'&&a.currency===currency).map((a:Any)=>creditSummary(s,a.id)).filter((c:Any)=>c.statement&&c.statementRemaining!>0&&c.statement.due>=start&&c.statement.due<end);
 return <div className="panel section-space"><h2>Card & personal repayment dates</h2>{cards.map((c:Any)=><div className="line" key={c.card.id}><span>{c.statement!.due} · {c.card.name}<small className="block">Statement remaining (tracked) · minimum entered {money(c.statement!.minimum,currency)}</small></span><strong>{money(c.statementRemaining!,currency)}</strong></div>)}{debts.map((d:Any)=><div className="line" key={d.id}><span>{d.due} · {d.person}<small className="block">{d.direction==='owe'?'I need to repay':'Expected back from them'}</small></span><strong>{money(d.remaining,currency)}</strong></div>)}{!debts.length&&!cards.length&&<p className="subtle">No outstanding card or personal repayment dates in this selected cycle.</p>}<p className="subtle">Remaining amounts are as of today. Due dates are expectations, not completed payments. These items do not automatically change your forecast; schedule a card transfer in Plans & bills if you want it included. Money owed to you is excluded until received.</p></div>;
}
