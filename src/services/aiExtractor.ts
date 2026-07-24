import type {Credibility,RelationType} from '../types'

type IdolReference={id:string;name:string}

export interface GuideContext{
 name?:string
 city?:string
 address?:string
}

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
 guideDraftGenerated?:boolean
 guideNotice?:string
 extractionMode?:'ai'|'rules'
}

export async function extractPlaceFromText(
 text:string,
 idols:IdolReference[],
 context:GuideContext={}
):Promise<ExtractedPlaceData>{
 try{
  const response=await fetch('/api/ai/extract',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({
    text,
    idolNames:idols.map(item=>item.name),
    context,
    generateGuide:true
   })
  })
  const payload=await response.json().catch(()=>null)
  if(!response.ok||!payload?.data) throw new Error(payload?.error||'AI 服务暂不可用')
  return normalizeResult(payload.data,text,idols,'ai')
 }catch{
  const fallback=await extractPlaceWithRules(text,idols,context)
  return {
   ...fallback,
   guideNotice:'AI 服务暂不可用，当前为本地规则生成的攻略草稿，请重点核实交通、开放时间和现场限制。'
  }
 }
}

function normalizeResult(data:Record<string,unknown>,text:string,idols:IdolReference[],mode:'ai'|'rules'):ExtractedPlaceData{
 const validTypes:RelationType[]=['same_style','filming','public_event','personal_share','other']
 const idol=idols.find(item=>item.name===data.idolName)
 return {
  name:stringOrEmpty(data.name),
  address:stringOrEmpty(data.address),
  city:stringOrEmpty(data.city),
  idolId:idol?.id,
  idolName:idol?.name||stringOrEmpty(data.idolName),
  relationType:validTypes.includes(data.relationType as RelationType)?data.relationType as RelationType:'personal_share',
  relationDescription:stringOrEmpty(data.relationDescription)||text.trim().slice(0,160),
  evidenceSource:stringOrEmpty(data.evidenceSource)||text.trim().slice(0,50),
  credibility:'C',
  transportGuide:stringOrEmpty(data.transportGuide),
  coreSpots:stringOrEmpty(data.coreSpots),
  tips:stringOrEmpty(data.tips),
  guideDraftGenerated:Boolean(data.guideDraftGenerated),
  guideNotice:stringOrEmpty(data.guideNotice)||'攻略内容由 AI 生成，仅作编辑草稿；发布前请核实交通、开放时间、预约要求和现场限制。',
  extractionMode:mode
 }
}

function stringOrEmpty(value:unknown){return typeof value==='string'?value.trim():''}

/** Offline fallback used when the AI proxy is unavailable. */
export async function extractPlaceWithRules(
 text:string,
 idols:IdolReference[],
 context:GuideContext={}
):Promise<ExtractedPlaceData>{
 const clean=text.replace(/\s+/g,' ').trim()
 const cities=['深圳','北京','上海','广州','杭州','成都','重庆','南京','武汉','西安']
 const city=cities.find(item=>clean.includes(item))||context.city
 const idol=idols.find(item=>clean.includes(item.name))
 const nameMatch=clean.match(/(?:在|去了|打卡(?:了)?)[：:\s]*([^，。！？；\n]{2,30}?)(?=，|。|！|？|；|的|同款|活动|节目|录制|$)/)
 const address=clean
  .split(/[，。！？；\n]/)
  .map(item=>item.trim())
  .find(item=>/[区路号层街道巷广场大厦中心公园]/.test(item)&&item.length>=4&&item.length<=80)
  ||context.address
 let relationType:RelationType='personal_share'
 if(/节目|录制|取景|拍摄/.test(clean)) relationType='filming'
 else if(/活动|发布会|见面会/.test(clean)) relationType='public_event'
 else if(/同款|穿搭/.test(clean)) relationType='same_style'

 const name=nameMatch?.[1]?.replace(new RegExp(`^(${cities.join('|')})`),'').trim()||context.name
 const extractedTransport=extractSection(clean,/地铁|公交|打车|交通|步行/)
 const extractedSpots=extractSection(clean,/打卡点|路线|地标|机位|位置/)
 const extractedTips=extractSection(clean,/最佳时间|游玩时长|避坑|注意|建议|预约/)
 const generated=buildSafeGuide({name,city,address})

 return {
  name,
  address,
  city,
  idolId:idol?.id,
  idolName:idol?.name,
  relationType,
  relationDescription:clean.slice(0,160),
  evidenceSource:clean.slice(0,50),
  credibility:'C',
  transportGuide:extractedTransport||generated.transportGuide,
  coreSpots:extractedSpots||generated.coreSpots,
  tips:extractedTips||generated.tips,
  guideDraftGenerated:!extractedTransport||!extractedSpots||!extractedTips,
  extractionMode:'rules'
 }
}

function extractSection(text:string,keywords:RegExp){
 const match=text.match(new RegExp(`(?:${keywords.source})[：:\\s]*([^。！？]{4,220})`))
 return match?.[1]?.trim()
}

function buildSafeGuide({name,city,address}:GuideContext){
 const place=name||'该地点'
 const location=[city,address].filter(Boolean).join('，')
 return {
  transportGuide:`建议使用地图导航至“${place}”${location?`（${location}）`:''}。优先选择公共交通，出发前根据实时路况确认最近出入口和步行路线；具体线路、出口及运营时间请以地图和运营方最新信息为准。`,
  coreSpots:`1. 到达后先确认公开入口、开放区域和现场指引。\n2. 对照原公开内容寻找主体建筑、招牌、景观或构图相近的位置。\n3. 按“入口 → 核心打卡位 → 周边可公开到访区域”的顺序游览，避免进入非开放空间。`,
  tips:`• 出发前核实开放时间、预约要求和临时管制。\n• 建议避开人流高峰，并为拍照和步行预留弹性时间。\n• 尊重现场秩序与隐私，不影响商户、居民或其他游客。\n• 攻略为 AI 草稿，准确交通和到访信息请以官方最新发布为准。`
 }
}
