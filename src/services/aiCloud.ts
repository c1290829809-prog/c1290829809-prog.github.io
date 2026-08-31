import {supabase} from './supabase'

type AiAction='extract-place'|'idol-profile'|'work-profile'

/** Calls the authenticated cloud function. Keys stay in Supabase, never in the browser. */
export async function callCloudAi<T>(action:AiAction,payload:Record<string,unknown>):Promise<T>{
 if(!supabase)throw new Error('云端 AI 尚未配置')
 const{data,error}=await supabase.functions.invoke('ai-research',{body:{action,...payload}})
 if(error)throw new Error(error.message||'云端 AI 服务暂不可用')
 if(!data?.data)throw new Error(data?.error||'云端 AI 未返回可用结果')
 return data.data as T
}
