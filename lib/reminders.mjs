import {isoDate,advanceDate} from './finance.mjs';
const escapeText=s=>String(s).replace(/\\/g,'\\\\').replace(/\r\n|\n|\r/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function foldCalendarLine(line){let out='',bytes=0;for(const ch of line){const size=new TextEncoder().encode(ch).length;if(bytes+size>75){out+='\r\n ';bytes=1;}out+=ch;bytes+=size;}return out;}
export function reminderEvents(ledger,today=isoDate(),end=advanceDate(today,'yearly')){
 const events=[];
 for(const r of ledger.recurring){if(!r.active||r.kind!=='expense'||r.cancellationConfirmed)continue;let date=r.next,n=0;while(date<end&&n++<1000){if(date>=today)events.push({id:`schedule-${r.id}-${date}`,date,title:`Nela: ${r.name} renewal / payment`});date=advanceDate(date,r.frequency,r.anchor);}if(r.cancellationDate&&r.cancellationDate>=today&&r.cancellationDate<end)events.push({id:`cancel-${r.id}-${r.cancellationDate}`,date:r.cancellationDate,title:`Nela: ${r.name} cancellation deadline`});}
 for(const b of ledger.billFunds||[])if(b.due>=today&&b.due<end)events.push({id:`fund-${b.id}-${b.due}`,date:b.due,title:`Nela: ${b.name} annual bill due`});
 return events.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function calendarReminders(ledger,{today=isoDate(),leadDays=7,now=new Date().toISOString()}={}){
 if(!Number.isInteger(leadDays)||leadDays<0||leadDays>90)throw Error('Choose 0–90 reminder days.');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nela//Local reminders//EN','CALSCALE:GREGORIAN'];
 const stamp=now.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 for(const event of reminderEvents(ledger,today)){
  const d=event.date.replaceAll('-','');lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(event.id)}@nela.local`,`DTSTAMP:${stamp}`,`DTSTART:${d}T090000`,`DTEND:${d}T093000`,`SUMMARY:${escapeText(event.title)}`,'DESCRIPTION:Exported snapshot from Nela. Review changes and alerts in your calendar.');
  for(const days of [...new Set([leadDays,0])])lines.push('BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escapeText(event.title)}`,`TRIGGER:${days?`-P${days}D`:'PT0S'}`,'END:VALARM');
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
}
