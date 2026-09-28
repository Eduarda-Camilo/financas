export const monthKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
const validMonth=month=>/^\d{4}-(0[1-9]|1[0-2])$/.test(month||'');
const validMoney=value=>Number.isSafeInteger(value)&&value>=0&&value<=100000000000;
const validPeople=new Set(['duda','flavio','cleide','luciene','sonia']);
const cleanDate=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';
 const date=new Date(`${value}T12:00:00`);
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value?value:'';
};
export function parseMoney(value='') {
 const clean=String(value).trim().replace(/R\$\s?/gi,'').replace(/[\s\u00a0]/g,'');
 if(!clean)return NaN;
 let normalized;
 if(clean.includes(',')){
  if(!/^\d+(?:\.\d{3})*(?:,\d{1,2})?$/.test(clean))return NaN;
  normalized=clean.replace(/\./g,'').replace(',','.');
 }else if(/^\d{1,3}(?:\.\d{3})+$/.test(clean))normalized=clean.replace(/\./g,'');
 else if(/^\d+(?:\.\d{1,2})?$/.test(clean))normalized=clean;
 else return NaN;
 const cents=Math.round(Number(normalized)*100);
 return Number.isSafeInteger(cents)?cents:NaN;
}
export function migrateData(input) {
 const data=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const legacySalary=Object.hasOwn(data,'salary')?data.salary:null;
 if(!Object.hasOwn(data,'defaultSalary'))data.defaultSalary=validMoney(legacySalary)?legacySalary:null;
 else if(data.defaultSalary!==null&&!validMoney(data.defaultSalary))data.defaultSalary=null;
 const salaries=data.monthlySalaries&&typeof data.monthlySalaries==='object'&&!Array.isArray(data.monthlySalaries)?data.monthlySalaries:{};
 data.monthlySalaries=Object.fromEntries(Object.entries(salaries).filter(([month,value])=>validMonth(month)&&validMoney(value)));
 const seen=new Set();
 data.purchases=(Array.isArray(data.purchases)?data.purchases:[]).filter(p=>p&&typeof p==='object'&&validMoney(p.amount)&&p.amount>0&&validMonth(p.month)).map((p,index)=>{
  let id=typeof p.id==='string'&&/^[a-z0-9_-]{1,100}$/i.test(p.id)?p.id:`purchase-${index}`;
  while(seen.has(id))id=`${id}-${index}`;
  seen.add(id);
  const method=p.method==='debit'?'debit':'credit';
  const person=validPeople.has(p.person)?p.person:'duda';
  const count=method==='credit'&&Number.isInteger(p.count)&&p.count>=1&&p.count<=36&&p.amount>=p.count?p.count:1;
  const startPart=method==='credit'&&Number.isInteger(p.startPart)&&p.startPart>=1&&p.startPart<=count?p.startPart:1;
  const pastInstallments=Array.isArray(p.pastInstallments)?p.pastInstallments.filter(row=>row&&validMonth(row.month)&&validMoney(row.amount)&&row.amount>0&&Number.isInteger(row.part)&&row.part>=1&&Number.isInteger(row.count)&&row.count>=row.part&&row.count<=36).map(row=>({...row,id,person,method,description:typeof row.description==='string'?row.description.slice(0,120):'',date:cleanDate(row.date),originalAmount:validMoney(row.originalAmount)&&row.originalAmount>0?row.originalAmount:p.amount})):[];
  return {...p,id,person,method,description:typeof p.description==='string'?p.description.slice(0,120):'',date:cleanDate(p.date),count,startPart,pastInstallments};
 });
 if(typeof data.updatedAt!=='string'||Number.isNaN(Date.parse(data.updatedAt)))delete data.updatedAt;
 data.demo=Boolean(data.demo);
 delete data.salary;
 return data;
}
export function salaryForMonth(data,month) {
 return Object.hasOwn(data.monthlySalaries??{},month)?data.monthlySalaries[month]:data.defaultSalary??null;
}
export function installments(purchase) {
 const count=purchase.method==='credit'?purchase.count||1:1;
 const startPart=purchase.method==='credit'?Math.min(count,Math.max(1,Math.trunc(Number(purchase.startPart)||1))):1;
 const [year,month]=purchase.month.split('-').map(Number);
 const base=Math.floor(purchase.amount/count),remainder=purchase.amount%count;
 const history=Array.isArray(purchase.pastInstallments)?purchase.pastInstallments:[];
 const upcoming=Array.from({length:count-startPart+1},(_,i)=>{const part=startPart+i;return {...purchase,amount:base+(part-1<remainder?1:0),originalAmount:purchase.amount,month:monthKey(new Date(year,month-1+i,1)),part,count};});
 return [...history,...upcoming];
}
export function summarize(rows,salary) {
 const credit=rows.filter(r=>r.person==='duda'&&r.method==='credit').reduce((s,r)=>s+r.amount,0);
 const debit=rows.filter(r=>r.person==='duda'&&r.method==='debit').reduce((s,r)=>s+r.amount,0);
 return {credit,debit,remaining:salary===null?null:salary-credit-debit,total:rows.filter(r=>r.method==='credit').reduce((s,r)=>s+r.amount,0)};
}
