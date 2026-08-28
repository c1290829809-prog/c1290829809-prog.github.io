import {createClient,type Session} from '@supabase/supabase-js'

export type CloudTable='places'|'idols'|'works'|'cities'|'feedback'|'events'

const url=(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/$/,'')
const anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY||''

export const cloudEnabled=Boolean(url&&anonKey)
export const supabase=cloudEnabled?createClient(url,anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null

function requireClient(){
 if(!supabase)throw new Error('Supabase 未配置，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
 return supabase
}

export async function readTable<T>(table:CloudTable){
 const{data,error}=await requireClient().from(table).select('id,data').order('updated_at',{ascending:false})
 if(error)throw new Error(`读取 ${table} 失败：${error.message}`)
 return(data||[]).map(row=>row.data as T)
}

export async function upsertRow<T extends{id:string}>(table:CloudTable,item:T){
 const{error}=await requireClient().from(table).upsert({id:item.id,data:item,updated_at:new Date().toISOString()},{onConflict:'id'})
 if(error)throw new Error(`保存 ${table} 失败：${error.message}`)
}

export async function upsertRows<T extends{id:string}>(table:CloudTable,items:T[]){
 if(!items.length)return
 const{error}=await requireClient().from(table).upsert(items.map(item=>({id:item.id,data:item,updated_at:new Date().toISOString()})),{onConflict:'id'})
 if(error)throw new Error(`批量保存 ${table} 失败：${error.message}`)
}

export async function deleteRow(table:CloudTable,id:string){
 const{error}=await requireClient().from(table).delete().eq('id',id)
 if(error)throw new Error(`删除 ${table} 失败：${error.message}`)
}

export async function readCloud(){
 const[places,idols,works,cities]=await Promise.all([readTable('places'),readTable('idols'),readTable('works'),readTable('cities')])
 return{places,idols,works,cities}
}

export async function getSession():Promise<Session|null>{
 if(!supabase)return null
 const{data,error}=await supabase.auth.getSession()
 if(error)throw new Error(`读取登录状态失败：${error.message}`)
 return data.session
}

export async function isCurrentUserAdmin(){
 if(!supabase)return false
 const{data,error}=await supabase.rpc('is_admin')
 if(error)throw new Error(`管理员权限校验失败：${error.message}`)
 return data===true
}
