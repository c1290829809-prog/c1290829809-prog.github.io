import type {WorkType} from '../stores'

export interface WorkProfileDraft{
 name:string
 type:WorkType
 year?:number
 region:string
 quote:string
 relatedIdolNames:string[]
 cityNames:string[]
 confidence:'high'|'medium'|'low'
 notice:string
}

export interface WorkProfileContext{
 type?:WorkType
 year?:number
 region?:string
 quote?:string
 relatedIdolNames?:string[]
 cityNames?:string[]
 availableIdols?:string[]
 availableCities?:string[]
}

export async function generateWorkProfile(name:string,context:WorkProfileContext={}):Promise<WorkProfileDraft>{
 const response=await fetch('/api/ai/work-profile',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({name:name.trim(),context})
 })
 const payload=await response.json().catch(()=>null)
 if(!response.ok||!payload?.data) throw new Error(payload?.error||'AI 作品资料补全暂不可用')
 const data=payload.data as Record<string,unknown>
 const validTypes:WorkType[]=['movie','tv','variety','book','music','other']
 const type=validTypes.includes(data.type as WorkType)?data.type as WorkType:context.type||'other'
 const year=Number(data.year)
 return {
  name:stringValue(data.name)||name.trim(),
  type,
  year:Number.isInteger(year)&&year>=1800&&year<=2100?year:undefined,
  region:stringValue(data.region),
  quote:stringValue(data.quote),
  relatedIdolNames:stringArray(data.relatedIdolNames),
  cityNames:stringArray(data.cityNames),
  confidence:['high','medium','low'].includes(String(data.confidence))?data.confidence as WorkProfileDraft['confidence']:'low',
  notice:stringValue(data.notice)||'AI 生成资料草稿，保存前请根据官方页面或可靠公开资料核实。'
 }
}

function stringValue(value:unknown){return typeof value==='string'?value.trim():''}
function stringArray(value:unknown){return Array.isArray(value)?value.map(stringValue).filter(Boolean):[]}
