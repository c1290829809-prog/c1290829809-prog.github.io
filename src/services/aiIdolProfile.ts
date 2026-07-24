export interface IdolProfileDraft{
 name:string
 roles:string[]
 customRoles:string[]
 bio:string
 cityNames:string[]
 fanName:string
 confidence:'high'|'medium'|'low'
 notice:string
}

export interface IdolProfileContext{
 roles?:string[]
 bio?:string
 cityNames?:string[]
 fanName?:string
 availableCities?:string[]
}

export async function generateIdolProfile(
 name:string,
 context:IdolProfileContext={}
):Promise<IdolProfileDraft>{
 const response=await fetch('/api/ai/idol-profile',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({name:name.trim(),context})
 })
 const payload=await response.json().catch(()=>null)
 if(!response.ok||!payload?.data) throw new Error(payload?.error||'AI 资料补全暂不可用')
 const data=payload.data as Record<string,unknown>
 const allowedRoles=['演员','歌手','偶像','主持人','导演','作家','音乐人']
 const roleValues=stringArray(data.roles)
 return {
  name:stringValue(data.name)||name.trim(),
  roles:roleValues.filter(role=>allowedRoles.includes(role)),
  customRoles:[
   ...roleValues.filter(role=>!allowedRoles.includes(role)),
   ...stringArray(data.customRoles)
  ].filter((role,index,items)=>items.indexOf(role)===index),
  bio:stringValue(data.bio),
  cityNames:stringArray(data.cityNames),
  fanName:stringValue(data.fanName),
  confidence:['high','medium','low'].includes(String(data.confidence))
   ?data.confidence as IdolProfileDraft['confidence']
   :'low',
  notice:stringValue(data.notice)||'AI 生成资料草稿，保存前请根据官方主页或公开资料核实。'
 }
}

function stringValue(value:unknown){return typeof value==='string'?value.trim():''}
function stringArray(value:unknown){
 return Array.isArray(value)
  ?value.map(stringValue).filter(Boolean)
  :[]
}
