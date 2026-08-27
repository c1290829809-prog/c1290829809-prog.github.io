type Table='places'|'idols'|'works'|'cities'
const base=(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/$/,'')
const apiKey=import.meta.env.VITE_SUPABASE_ANON_KEY||''
export const cloudEnabled=Boolean(base&&apiKey)
async function call(path:string,init:RequestInit={}){if(!cloudEnabled)throw new Error('Supabase 未配置');const response=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{apikey:apiKey,Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',...(init.headers||{})}});if(!response.ok)throw new Error(`Supabase 请求失败（${response.status}）`);return response.status===204?null:response.json()}
export async function readTable<T>(table:Table){const rows=await call(`${table}?select=id,data`);return (rows as {id:string;data:T}[]).map(row=>row.data)}
export async function writeTable<T extends {id:string}>(table:Table,items:T[]){if(!items.length)return;await call(table,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(items.map(data=>({id:data.id,data})))})}
export async function readCloud(){const [places,idols,works,cities]=await Promise.all([readTable('places'),readTable('idols'),readTable('works'),readTable('cities')]);return{places,idols,works,cities}}
