export const monthKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
export function migrateData(data) {
 if (!Object.hasOwn(data,'defaultSalary')) data.defaultSalary=data.salary??null;
 data.monthlySalaries??={};
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
