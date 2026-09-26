import {installments} from './finance.js';
// A row edits the original purchase; its installments remain linked across months.
export function purchaseFromRow(values,{person,method,month,existing,parseMoney,id}) {
 const amount=parseMoney(values.amount||'');
 if(!Number.isSafeInteger(amount)||amount<=0||amount>100000000000)throw Error('Informe um valor total maior que zero.');
 const count=method==='credit'?Number(values.count||1):1;
 if(!Number.isInteger(count)||count<1||count>36)throw Error('Use de 1 a 36 parcelas.');
 if(amount<count)throw Error('Cada parcela precisa ter pelo menos R$ 0,01.');
 const previousSchedule=existing?installments(existing):[];
 const previousCurrent=previousSchedule.find(row=>row.month===month);
 const part=method==='credit'?Number(values.part??previousCurrent?.part??existing?.startPart??1):1;
 if(!Number.isInteger(part)||part<1||part>count)throw Error(`A parcela atual deve estar entre 1 e ${count}.`);
 let firstMonth=existing?.month||month,startPart=existing?.startPart||1,pastInstallments=existing?.pastInstallments||[];
 let reanchored=false;
 if(!existing){firstMonth=month;startPart=part;}
 else {
  const scheduled=previousSchedule,current=previousCurrent;
  if(current&&(part!==current.part||month>existing.month)){
   const history=new Map(scheduled.filter(row=>row.month<month).map(row=>[row.month,{id:row.id,person:row.person,method:row.method,description:row.description,amount:row.amount,originalAmount:row.originalAmount,month:row.month,date:row.date,part:row.part,count:row.count}]));
   pastInstallments=[...history.values()];firstMonth=month;startPart=part;reanchored=true;
  } else if(current){startPart=existing.startPart||1;}
 }
 const date=values.date??existing?.date??'';
 if(date){
  const d=new Date(date+'T12:00:00');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('Informe uma data válida.');
  if(!reanchored&&date.slice(0,7)!==firstMonth)throw Error(`A data deve pertencer ao mês inicial da compra (${firstMonth.split('-').reverse().join('/')}).`);
 }
 return {id:existing?.id||id,person,method,month:firstMonth,date,amount,count,startPart,pastInstallments,description:(values.description||'').trim().slice(0,120)};
}
