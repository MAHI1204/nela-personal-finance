import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyLedger} from '../lib/finance.mjs';
import {spendingAnalysis} from '../lib/analysis.mjs';
const ledger=()=>({...emptyLedger(),accounts:[{id:'e',currency:'EUR',kind:'bank',opening:0},{id:'i',currency:'INR',kind:'bank',opening:0},{id:'c',currency:'EUR',kind:'credit',opening:0}]});
const tx=(id,date,amount,kind='expense',account='e',merchant='Cafe')=>({id,date,amount,kind,account,merchant,category:'Dining'});
test('actuals isolate currencies, future entries, transfers and returns; include card purchases',()=>{
 const l=ledger();l.transactions=[tx('a','2026-10-01',10000),tx('b','2026-10-02',5000,'income'),tx('r','2026-10-03',2000,'refund'),tx('c','2026-10-04',3000,'expense','c',' cafe '),tx('i','2026-10-02',99999,'expense','i'),tx('f','2026-10-21',99999),{...tx('t','2026-10-05',9000,'transfer'),toAccount:'c',toAmount:9000}];
 const a=spendingAnalysis(l,'EUR','2026-10-10','2026-10-20');
 assert.equal(a.gross,13000);assert.equal(a.returned,2000);assert.equal(a.net,11000);assert.equal(a.income,5000);assert.equal(a.surplus,-6000);assert.equal(a.average,650);assert.equal(a.end,'2026-10-21');assert.equal(a.merchants.length,1);assert.equal(a.merchants[0].count,2);assert.equal(a.merchants[0].amount,13000);
});
test('matches elapsed days for salary cycles instead of comparing a partial cycle with a full one',()=>{
 const l=ledger();l.settings.cycleDay=13;l.transactions=[tx('p','2026-09-13',1000),tx('late','2026-10-01',9000),tx('c','2026-10-13',1500)];
 const a=spendingAnalysis(l,'EUR','2026-10-20','2026-10-20');assert.equal(a.matchedDays,8);assert.equal(a.currentEnd,'2026-10-21');assert.equal(a.priorEnd,'2026-09-21');assert.equal(a.prior.spent,1000);assert.equal(a.delta,500);assert.equal(a.percent,50);assert.equal(a.categories[0].delta,500);
});
test('completed long cycles cap comparison to the shorter cycle without truncating actuals',()=>{
 const l=ledger();l.transactions=[tx('p','2024-02-29',500),tx('c','2024-03-29',1000),tx('tail','2024-03-31',3000)];
 const a=spendingAnalysis(l,'EUR','2024-03-15','2024-04-05');assert.equal(a.elapsed,31);assert.equal(a.matchedDays,29);assert.equal(a.currentEnd,'2024-03-30');assert.equal(a.priorEnd,'2024-03-01');assert.equal(a.net,4000);assert.equal(a.current.spent,1000);assert.equal(a.prior.spent,500);
});
test('future cycles are empty and do not divide by zero',()=>{
 const l=ledger();l.transactions=[tx('f','2026-11-01',2000)];const a=spendingAnalysis(l,'EUR','2026-11-01','2026-10-20');assert.equal(a.elapsed,0);assert.equal(a.net,0);assert.equal(a.average,null);assert.equal(a.percent,null);assert.equal(a.prior.spent,0);
});
test('prior refunds, absent history and unnamed merchants have explicit results',()=>{
 const l=ledger();l.transactions=[tx('r','2026-09-01',3000,'refund'),tx('c','2026-10-01',1000,'expense','e','')];const a=spendingAnalysis(l,'EUR','2026-10-20','2026-10-20');assert.equal(a.percent,null);assert.equal(a.prior.spent,-3000);assert.equal(a.delta,4000);assert.equal(a.merchants[0].name,'No merchant recorded');assert.equal(a.categories[0].delta,4000);
});
