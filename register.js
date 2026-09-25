import {installments,salaryForMonth} from './finance.js';
import {purchaseFromRow} from './register-model.js';

export function createRegister(ctx){
 const {getData,getMonth,monthHeader,people,money,esc,icon,parseMoney,save,render,toast,rows}=ctx;
 let person='duda',method='credit',drafts={},edits={};
 const key=()=>`${getMonth()}/${person}/${method}`;
 const valueText=n=>(n/100).toFixed(2).replace('.',',');
 const fields=()=>method==='credit'?['description','amount','count','date']:['description','amount','date'];
 function newDraft(){return {key:crypto.randomUUID(),values:{description:'',amount:'',count:'1',date:''}};}
 function draftList(){return drafts[key()]??=(Array.from({length:5},newDraft));}
 const selectedRows=()=>rows().filter(t=>t.person===person&&t.method===method);
 function rowHTML(t,index,draft){
  const original=t?getData().purchases.find(p=>p.id===t.id):null;
  const editing=original?edits[original.id]:draft;
  const v=editing?.values||{description:original.description,amount:valueText(original.amount),count:String(original.count||1),date:original.date||''};
  const label=`linha ${index}`;
  return `<tr ${original?`data-purchase="${original.id}"`:`data-draft="${draft.key}"`} class="${editing?.error?'row-error':''}"><th scope="row">${index}</th><td><input data-field="description" aria-label="Descrição, ${label}" value="${esc(v.description)}" placeholder="${original?'Sem descrição':'Digite uma compra…'}" maxlength="120"></td><td><input data-field="amount" inputmode="decimal" aria-label="Valor total, ${label}" value="${esc(v.amount)}" placeholder="0,00"></td>${method==='credit'?`<td><input data-field="count" type="number" min="1" max="36" aria-label="Parcelas, ${label}" value="${esc(v.count)}"></td>`:''}<td><input data-field="date" type="date" aria-label="Data da compra, ${label}" value="${esc(v.date)}" min="${original?.month||getMonth()}-01" max="${lastDay(original?.month||getMonth())}"></td><td class="sheet-month-value">${t?money(t.amount):'—'}<small>${t&&t.count>1?`${t.part}/${t.count}`:''}</small></td><td class="row-state" aria-live="polite">${editing?.error?esc(editing.error):original?'Salvo':'Nova linha'}</td><td>${original?`<button class="icon-button" data-detail="${original.id}" aria-label="Detalhes da compra, ${label}">${icon('right')}</button>`:''}</td></tr>`;
 }
 function lastDay(month){const [y,m]=month.split('-').map(Number);return `${month}-${new Date(y,m,0).getDate()}`;}
 function salaryHTML(){const d=getData(),own=Object.hasOwn(d.monthlySalaries,getMonth()),salary=salaryForMonth(d,getMonth());return `<section class="panel salary-register"><div class="sheet-heading"><div><h2>Salário recebido</h2><p>O valor deste mês substitui o padrão só neste mês.</p></div><span class="salary-source">${own?'Valor personalizado':'Usando o padrão'}</span></div><div class="sheet-scroll"><table class="entry-table salary-table"><thead><tr><th scope="col">Referência</th><th scope="col">Valor recebido (R$)</th><th scope="col">Status</th></tr></thead><tbody><tr><td>Salário de ${getMonth().split('-').reverse().join('/')}</td><td><input id="monthly-salary" inputmode="decimal" aria-label="Salário recebido neste mês" placeholder="0,00" value="${salary===null?'':valueText(salary)}"></td><td id="salary-status" role="status">${salary===null?'Não informado':own?'Salvo para este mês':'Valor padrão'}</td></tr></tbody></table></div><div class="sheet-footer"><span>Padrão: ${d.defaultSalary===null?'não informado':money(d.defaultSalary)}</span>${own?'<button class="text-button" data-register-action="salary-default">Usar padrão neste mês</button>':'<button class="text-button" data-page="settings">Editar padrão</button>'}</div></section>`;}
 function view(){const p=people.find(p=>p.id===person);const all=selectedRows();return `<div class="page-heading">${monthHeader()}</div><section class="register-controls" aria-label="Opções do registro"><label>Pessoa<select id="register-person" class="${p.color}">${people.map(p=>`<option value="${p.id}" ${p.id===person?'selected':''}>${p.name}</option>`).join('')}</select></label><label>Registro${person==='duda'?`<select id="register-method"><option value="credit" ${method==='credit'?'selected':''}>Cartão de crédito</option><option value="debit" ${method==='debit'?'selected':''}>Débito</option><option value="salary" ${method==='salary'?'selected':''}>Salário recebido</option></select>`:`<div class="fixed-method">${icon('card')} Cartão de crédito</div>`}</label></section>${method==='salary'?salaryHTML():`<section class="panel register-panel"><div class="sheet-heading"><div><h2>Registro de gastos</h2><p>Digite nas células. Salvo automaticamente ao sair de cada campo.</p></div><span id="register-status" role="status">${icon('check')} Tudo salvo</span></div><div class="sheet-scroll" role="region" aria-label="Planilha de gastos" tabindex="0"><table class="entry-table"><thead><tr><th scope="col">#</th><th scope="col">Descrição <small>opcional</small></th><th scope="col">Valor total (R$)</th>${method==='credit'?'<th scope="col">Parcelas</th>':''}<th scope="col">Data <small>opcional</small></th><th scope="col">Neste mês</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Detalhes</span></th></tr></thead><tbody id="register-body">${all.map((t,i)=>rowHTML(t,i+1)).join('')}${draftList().map((d,i)=>rowHTML(null,all.length+i+1,d)).join('')}</tbody></table></div><div class="sheet-footer"><button class="text-button" data-register-action="more">${icon('plus')} Mais linhas</button><span>Total de ${p.name} neste mês <strong id="register-total">${money(all.reduce((sum,t)=>sum+t.amount,0))}</strong></span></div></section><div class="sheet-hints"><p><kbd>Tab</kbd> próximo campo <span>·</span> <kbd>Enter</kbd> próxima linha <span>·</span> Cole várias células de uma planilha.</p><p>${method==='credit'?'Informe o valor total da compra e a quantidade de parcelas (1 = à vista). A primeira entra no mês selecionado. Alterações em compras existentes atualizam todas as suas parcelas.':'Os gastos entram no débito da Duda no mês selecionado.'} A data é opcional e pertence ao mês inicial da compra.</p></div>`}`;}
 function valuesFromRow(tr){return Object.fromEntries([...tr.querySelectorAll('[data-field]')].map(el=>[el.dataset.field,el.value]));}
 function remember(tr){const values=valuesFromRow(tr);if(tr.dataset.purchase){edits[tr.dataset.purchase]={values};return edits[tr.dataset.purchase];}const draft=draftList().find(d=>d.key===tr.dataset.draft);draft.values=values;return draft;}
 function setStatus(message){const el=document.querySelector('#register-status');if(el)el.textContent=message;}
 function commit(tr){
  const state=remember(tr),d=getData(),existing=d.purchases.find(p=>p.id===tr.dataset.purchase);
  const touched=state.values.amount||state.values.description||state.values.date||Number(state.values.count||1)!==1;
  if(!existing&&!touched){state.error='';tr.classList.remove('row-error');tr.querySelector('.row-state').textContent='Nova linha';return;}
  try{
   const purchase=purchaseFromRow(state.values,{person,method,month:getMonth(),existing,parseMoney,id:crypto.randomUUID()});
   const index=existing?d.purchases.indexOf(existing):d.purchases.length;
   if(existing)d.purchases[index]=purchase;else d.purchases.push(purchase);
   if(!save()){if(existing)d.purchases[index]=existing;else d.purchases.pop();throw Error('Não salvo. Tente editar novamente.');}
   delete edits[purchase.id];
   if(tr.dataset.draft){drafts[key()]=draftList().filter(row=>row.key!==tr.dataset.draft);delete tr.dataset.draft;}
   tr.dataset.purchase=purchase.id;state.error='';tr.classList.remove('row-error');
   tr.querySelectorAll('[data-field]').forEach(input=>input.removeAttribute('aria-invalid'));
   tr.querySelector('.row-state').textContent='Salvo';
   const installment=installments(purchase).find(t=>t.month===getMonth());
   tr.querySelector('.sheet-month-value').innerHTML=installment?`${money(installment.amount)}<small>${purchase.count>1?`${installment.part}/${purchase.count}`:''}</small>`:'Não entra neste mês';
   tr.lastElementChild.innerHTML=`<button class="icon-button" data-detail="${purchase.id}" aria-label="Detalhes desta compra">${icon('right')}</button>`;
   document.querySelector('#register-total').textContent=money(selectedRows().reduce((sum,t)=>sum+t.amount,0));
   setStatus('Salvo · dashboard atualizado');
  }catch(error){state.error=error.message;tr.classList.add('row-error');tr.querySelector('.row-state').textContent=error.message;setStatus('Há uma linha para revisar');}
 }
 function appendRow(){const draft=newDraft();draftList().push(draft);const body=document.querySelector('#register-body');body.insertAdjacentHTML('beforeend',rowHTML(null,body.children.length+1,draft));return body.lastElementChild;}
 document.addEventListener('input',e=>{const tr=e.target.closest('#register-body tr');if(tr&&e.target.dataset.field){remember(tr);setStatus('Editando…');}});
 document.addEventListener('change',e=>{
  if(e.target.id==='register-person'){person=e.target.value;if(person!=='duda')method='credit';render();}
  if(e.target.id==='register-method'){method=e.target.value;render();}
  const tr=e.target.closest('#register-body tr');if(tr&&e.target.dataset.field)commit(tr);
  if(e.target.id==='monthly-salary'){
   const value=parseMoney(e.target.value),status=document.querySelector('#salary-status');
   if(!Number.isSafeInteger(value)||value<0){status.textContent='Informe um valor válido (zero é permitido).';e.target.setAttribute('aria-invalid','true');return;}
   const d=getData(),month=getMonth(),had=Object.hasOwn(d.monthlySalaries,month),old=d.monthlySalaries[month];d.monthlySalaries[month]=value;
   if(save()){e.target.removeAttribute('aria-invalid');status.textContent='Salvo · dashboard atualizado';document.querySelector('.salary-source').textContent='Valor personalizado';render();}else{if(had)d.monthlySalaries[month]=old;else delete d.monthlySalaries[month];status.textContent='Não salvo';}
  }
 });
 document.addEventListener('keydown',e=>{
  if(e.target.id==='monthly-salary'&&e.key==='Enter'){e.preventDefault();e.target.blur();}
  const tr=e.target.closest('#register-body tr');if(!tr||!e.target.dataset.field)return;
  if(e.key==='Enter'){e.preventDefault();commit(tr);const next=(e.shiftKey?tr.previousElementSibling:tr.nextElementSibling)||(!e.shiftKey?appendRow():tr);next.querySelector(`[data-field="${e.target.dataset.field}"]`)?.focus();}
  if(e.key==='Tab'&&!e.shiftKey&&e.target.dataset.field===fields().at(-1)){
   e.preventDefault();commit(tr);(tr.nextElementSibling||appendRow()).querySelector('[data-field]')?.focus();
  }
 });
 document.addEventListener('paste',e=>{
  const tr=e.target.closest('#register-body tr');if(!tr||!e.target.dataset.field)return;
  const text=e.clipboardData.getData('text/plain');if(!/[\t\n]/.test(text))return;
  e.preventDefault();const lines=text.replace(/\r/g,'').replace(/\n$/,'').split('\n');if(lines.length>500){toast('Cole até 500 linhas por vez.');return;}
  const start=fields().indexOf(e.target.dataset.field);let current=tr;
  lines.forEach((line,index)=>{if(index)current=current.nextElementSibling||appendRow();line.split('\t').forEach((value,j)=>{const input=current.querySelector(`[data-field="${fields()[start+j]}"]`);if(input){if(input.type==='date'&&/^\d{2}\/\d{2}\/\d{4}$/.test(value))value=value.split('/').reverse().join('-');input.value=value;}});commit(current);});
  current.querySelector(`[data-field="${e.target.dataset.field}"]`)?.focus();
 });
 document.addEventListener('click',e=>{const action=e.target.closest('[data-register-action]')?.dataset.registerAction;
  if(action==='more'){const row=appendRow();for(let i=0;i<4;i++)appendRow();row.querySelector('input').focus();}
  if(action==='salary-default'){const d=getData(),month=getMonth(),previous=d.monthlySalaries[month];delete d.monthlySalaries[month];if(save()){render();toast('Padrão aplicado somente a este mês.');}else d.monthlySalaries[month]=previous;}
 });
 return {render:view,reset(){drafts={};edits={};}};
}
