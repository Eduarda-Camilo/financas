import {test} from 'node:test';import assert from 'node:assert/strict';import {installments,summarize} from './finance.js';
import {migrateData,salaryForMonth,parseMoney} from './finance.js';
import {purchaseFromRow} from './register-model.js';
test('parcelas preservam centavos e atravessam anos',()=>{const rows=installments({amount:10000,count:3,method:'credit',month:'2026-12'});assert.deepEqual(rows.map(r=>r.amount),[3334,3333,3333]);assert.deepEqual(rows.map(r=>r.month),['2026-12','2027-01','2027-02']);});
test('salário desconta exclusivamente gastos da Duda',()=>{assert.deepEqual(summarize([{person:'duda',method:'credit',amount:150000},{person:'duda',method:'debit',amount:60000},{person:'flavio',method:'credit',amount:92000}],500000),{credit:150000,debit:60000,remaining:290000,total:242000});});
test('salário ausente e mês vazio',()=>{assert.equal(summarize([],null).remaining,null);assert.equal(summarize([],500000).remaining,500000);});
test('migração preserva salário anterior como padrão e compras válidas',()=>{const data=migrateData({salary:400000,purchases:[{id:'a',person:'duda',method:'credit',amount:12000,count:3,month:'2026-09',description:'Compra'}]});assert.equal(data.defaultSalary,400000);assert.equal(data.purchases.length,1);assert.equal(data.purchases[0].id,'a');assert.equal(data.purchases[0].amount,12000);assert.equal(salaryForMonth(data,'2026-09'),400000);});
test('salários mensais inclusive zero são independentes do padrão',()=>{const data={defaultSalary:400000,monthlySalaries:{'2026-09':510000,'2026-10':0}};data.defaultSalary=450000;assert.equal(salaryForMonth(data,'2026-09'),510000);assert.equal(salaryForMonth(data,'2026-10'),0);assert.equal(salaryForMonth(data,'2026-11'),450000);assert.equal(summarize([],salaryForMonth(data,'2026-09')).remaining,510000);});
test('registro sem data usa mês selecionado e distribui parcelas no dashboard',()=>{const purchase=purchaseFromRow({amount:'600',count:'6'},{person:'flavio',method:'credit',month:'2026-12',parseMoney,id:'a'});const schedule=installments(purchase);assert.equal(purchase.date,'');assert.equal(schedule[0].month,'2026-12');assert.equal(schedule[1].month,'2027-01');assert.deepEqual(summarize([schedule[0]],400000),{credit:0,debit:0,remaining:400000,total:10000});});
test('editar compra em mês posterior preserva parcelas passadas e atualiza só o futuro',()=>{const existing={id:'original',person:'duda',method:'credit',description:'Compra',amount:90000,count:3,startPart:1,month:'2026-09',date:'2026-09-10'};const purchase=purchaseFromRow({amount:'900',count:'3',part:'2',date:'2026-09-10'},{person:'duda',method:'credit',month:'2026-10',existing,parseMoney,id:'novo'});assert.equal(purchase.id,'original');assert.equal(purchase.month,'2026-10');assert.deepEqual(installments(purchase).map(r=>[r.month,r.part]),[['2026-09',1],['2026-10',2],['2026-11',3]]);});
test('valores e parcelamentos inválidos não viram gastos',()=>{const options={person:'duda',method:'credit',month:'2026-09',parseMoney,id:'a'};for(const values of [{amount:'-1'},{amount:'abc'},{amount:'1',count:'37'},{amount:'1',count:'1.5'},{amount:'0,01',count:'2'},{amount:'10',date:'2026-10-01'}])assert.throws(()=>purchaseFromRow(values,options));});

test('compra lançada no meio do parcelamento começa no mês escolhido e só segue adiante',()=>{const purchase=purchaseFromRow({amount:'1200',count:'12',part:'7'},{person:'duda',method:'credit',month:'2026-09',parseMoney,id:'late'});const schedule=installments(purchase);assert.deepEqual(schedule.map(r=>[r.month,r.part]),[['2026-09',7],['2026-10',8],['2026-11',9],['2026-12',10],['2027-01',11],['2027-02',12]]);assert.ok(schedule.every(r=>r.month>='2026-09'));assert.ok(schedule.every(r=>r.amount===10000));});
test('mudar parcela atual preserva meses anteriores já registrados e muda o futuro',()=>{const existing={id:'old',person:'duda',method:'credit',amount:60000,count:6,startPart:1,month:'2026-06',description:'Compra'};const updated=purchaseFromRow({amount:'600',count:'6',part:'5',description:'Compra'},{person:'duda',method:'credit',month:'2026-08',existing,parseMoney,id:'new'});assert.equal(updated.month,'2026-08');assert.deepEqual(installments(updated).map(r=>[r.month,r.part]),[['2026-06',1],['2026-07',2],['2026-08',5],['2026-09',6]]);});
test('parcela atual precisa estar entre um e o total de parcelas',()=>{const options={person:'duda',method:'credit',month:'2026-09',parseMoney,id:'x'};assert.throws(()=>purchaseFromRow({amount:'120',count:'3',part:'4'},options),/parcela atual/i);assert.throws(()=>purchaseFromRow({amount:'120',count:'3',part:'1.5'},options),/parcela atual/i);});
test('valores brasileiros com milhar e centavos são interpretados corretamente',()=>{
 assert.equal(parseMoney('1.234'),123400);
 assert.equal(parseMoney('1.234,56'),123456);
 assert.equal(parseMoney('1234,56'),123456);
 assert.equal(parseMoney('1234.56'),123456);
 assert.equal(parseMoney('R$ 1.234,50'),123450);
 assert.ok(Number.isNaN(parseMoney('1.23.4')));
});
test('migração recupera estruturas locais incompletas sem derrubar o aplicativo',()=>{
 assert.deepEqual(migrateData('inválido'),{defaultSalary:null,monthlySalaries:{},purchases:[],demo:false});
 const migrated=migrateData({defaultSalary:'4000',monthlySalaries:{'2026-09':500000,'mês ruim':100},purchases:[null,{id:'ok',person:'desconhecida',method:'credit',amount:12000,count:3,month:'2026-09',date:'2026-99-99'},{id:'ruim',amount:-1,month:'2026-09'}]});
 assert.equal(migrated.defaultSalary,null);
 assert.deepEqual(migrated.monthlySalaries,{'2026-09':500000});
 assert.equal(migrated.purchases.length,1);
 assert.equal(migrated.purchases[0].id,'ok');
 assert.equal(migrated.purchases[0].person,'duda');
 assert.equal(migrated.purchases[0].date,'');
});
test('parcela inicial avançada mantém a distribuição original dos centavos',()=>{
 const rows=installments({id:'x',person:'duda',method:'credit',amount:10000,count:6,startPart:4,month:'2026-09'});
 assert.deepEqual(rows.map(row=>[row.part,row.amount]),[[4,1667],[5,1666],[6,1666]]);
 assert.deepEqual(rows.map(row=>row.month),['2026-09','2026-10','2026-11']);
});
