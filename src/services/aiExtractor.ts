import type {Credibility,Idol,RelationType} from '../types'

export interface ExtractedPlaceData{
 name?:string
 address?:string
 city?:string
 idolId?:string
 idolName?:string
 relationType:RelationType
 relationDescription:string
 evidenceSource:string
 credibility:Credibility
 transportGuide?:string
 coreSpots?:string
 tips?:string
}

export async function extractPlaceFromText(text:string,idols:Idol[]):Promise<ExtractedPlaceData>{
 const response=await fetch('/api/ai/extract',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,idolNames:idols.map(x=>x.name)})})
 const payload=await response.json().catch(()=>({}))
 if(!response.ok)throw new Error(payload.error||'AI 提取失败')
 const data=payload.data||{}
 const validTypes:RelationType[]=['same_style','filming','public_event','personal_share']
 const idol=idols.find(x=>x.name===data.idolName)
 return {name:stringOrEmpty(data.name),address:stringOrEmpty(data.address),city:stringOrEmpty(data.city),idolId:idol?.id,idolName:idol?.name,relationType:validTypes.includes(data.relationType)?data.relationType:'personal_share',relationDescription:stringOrEmpty(data.relationDescription)||text.trim().slice(0,160),evidenceSource:stringOrEmpty(data.evidenceSource)||text.trim().slice(0,50),credibility:'C',transportGuide:stringOrEmpty(data.transportGuide),coreSpots:stringOrEmpty(data.coreSpots),tips:stringOrEmpty(data.tips)}
}

function stringOrEmpty(value:unknown){return typeof value==='string'?value.trim():''}

/** Local fallback retained for offline development and automated tests. */
export async function extractPlaceWithRules(text:string,idols:Idol[]):Promise<ExtractedPlaceData>{
 const clean=text.replace(/\s+/g,' ').trim()
 const city=['深圳','北京','上海','广州','杭州','成都','重庆','南京','武汉','西安'].find(x=>clean.includes(x))
 const idol=idols.find(x=>clean.includes(x.name))
 const nameMatch=clean.match(/(?:在|去了|打卡(?:了)?)[：:\s]*([^，。！？；\n]{2,30}?)(?=，|。|！|？|；|的(?:同款|活动|节目|录制)|$)/)
 const addressCandidates=clean.split(/[，。！？；\n]/).map(x=>x.trim())
 const address=addressCandidates.find(x=>/[区路号层]/.test(x)&&x.length>=4&&x.length<=60)
 let relationType:RelationType='personal_share'
 if(/节目|录制/.test(clean)) relationType='filming'
 else if(/活动|发布会/.test(clean)) relationType='public_event'
 else if(/同款|穿搭/.test(clean)) relationType='same_style'
 return {
  name:nameMatch?.[1]?.replace(/^(深圳|北京|上海|广州|杭州|成都|重庆|南京|武汉|西安)/,'').trim(),
  address,
  city,
  idolId:idol?.id,
  idolName:idol?.name,
  relationType,
  relationDescription:clean.slice(0,160),
  evidenceSource:clean.slice(0,50),
  credibility:'C',
  transportGuide:extractSection(clean,/地铁|公交|打车|交通/),
  coreSpots:extractSection(clean,/打卡点|路线|地标|位置/),
  tips:extractSection(clean,/最佳时间|游玩时长|避坑|注意|建议/)
 }
}
function extractSection(text:string,keywords:RegExp){const match=text.match(new RegExp(`(?:${keywords.source})[：:\\s]*([^。！？]{4,160})`));return match?.[1]?.trim()}
