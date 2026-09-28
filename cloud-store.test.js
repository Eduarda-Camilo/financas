import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CloudStore} from './cloud-store.js';

function memoryStorage(){
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('configuração aceita chave pública e bloqueia chave secreta',()=>{
 globalThis.localStorage=memoryStorage();
 const store=new CloudStore();
 store.setConfig('https://projeto-teste.supabase.co/','sb_publishable_teste');
 assert.deepEqual(store.config,{url:'https://projeto-teste.supabase.co',key:'sb_publishable_teste'});
 assert.throws(()=>store.setConfig('https://projeto-teste.supabase.co','sb_secret_nao_usar'),/publishable/i);
});

test('gravações na nuvem são serializadas na ordem das alterações',async()=>{
 globalThis.localStorage=memoryStorage();
 const store=new CloudStore();
 const events=[];
 store.write=async data=>{
  events.push(`início ${data.version}`);
  await new Promise(resolve=>setTimeout(resolve,data.version===1?30:1));
  events.push(`fim ${data.version}`);
 };
 await Promise.all([store.queueWrite({version:1}),store.queueWrite({version:2})]);
 assert.deepEqual(events,['início 1','fim 1','início 2','fim 2']);
});

test('dados locais mais recentes vencem uma cópia antiga da nuvem',async()=>{
 globalThis.localStorage=memoryStorage();
 const store=new CloudStore();
 store.session={access_token:'token',user:{id:'user'}};
 const local={updatedAt:'2026-09-28T12:00:00.000Z',purchases:[{id:'local'}]};
 let written=null;
 store.request=async path=>{
  if(path.includes('select='))return [{data:{updatedAt:'2026-09-28T11:00:00.000Z',purchases:[{id:'cloud'}]},updated_at:'2026-09-28T11:00:00.000Z'}];
  return {};
 };
 store.write=async data=>{written=structuredClone(data);};
 assert.deepEqual(await store.loadOrMigrate(local),local);
 assert.deepEqual(written,local);
});

test('dados da nuvem mais recentes são carregados no aparelho',async()=>{
 globalThis.localStorage=memoryStorage();
 const store=new CloudStore();
 store.session={access_token:'token',user:{id:'user'}};
 const remote={updatedAt:'2026-09-28T13:00:00.000Z',purchases:[{id:'cloud'}]};
 store.request=async()=>[{data:remote,updated_at:'2026-09-28T13:00:00.000Z'}];
 assert.deepEqual(await store.loadOrMigrate({updatedAt:'2026-09-28T12:00:00.000Z',purchases:[]}),remote);
});
