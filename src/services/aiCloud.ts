import {supabase} from './supabase'

export type BatchPlaceDraft={
 type?:string
 relatedPeople?:string
 relatedWorks?:string
 placeName?:string
 city?:string
 district?:string
 address?:string
 lat?:string|number
 lng?:string|number
 relation?:string
 source?:string
 confidenceText?:string
}

type AiAction='extract-place'|'idol-profile'|'work-profile'|'extract-table-image'

/** Calls the authenticated cloud function. Keys stay in Supabase, never in the browser. */
export async function callCloudAi<T>(action:AiAction,payload:Record<string,unknown>):Promise<T>{
 if(!supabase)throw new Error('云端 AI 尚未配置')
 const{data,error}=await supabase.functions.invoke('ai-research',{body:{action,...payload}})
 if(error)throw new Error(error.message||'云端 AI 服务暂不可用')
 if(!data?.data)throw new Error(data?.error||'云端 AI 未返回可用结果')
 return data.data as T
}

/** Reads a table screenshot into editable drafts. It does not write any business data. */
export async function extractPlacesFromImage(imageDataUrl:string):Promise<{rows:BatchPlaceDraft[];notice?:string}>{
 return callCloudAi('extract-table-image',{imageDataUrl})
}
