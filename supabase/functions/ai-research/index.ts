// Supabase Edge Function: authenticated admin-only AI research.
// Set DEEPSEEK_API_KEY with: supabase secrets set DEEPSEEK_API_KEY=...

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}})

Deno.serve(async request=>{
 if(request.method==='OPTIONS')return json({},204)
 if(request.method!=='POST')return json({error:'仅支持 POST 请求'},405)
 try{
  const authorization=request.headers.get('Authorization')||''
  if(!authorization.startsWith('Bearer '))throw new Error('请先登录管理员账号')
  const adminClient=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_ANON_KEY')||'',{global:{headers:{Authorization:authorization}}})
  const{data:isAdmin,error:adminError}=await adminClient.rpc('is_admin')
  if(adminError||isAdmin!==true)throw new Error('无后台管理员权限')

  const body=await request.json()
  const action=String(body.action||'')
  if(!['extract-place','idol-profile','work-profile'].includes(action))throw new Error('不支持的 AI 请求')
  const query=action==='extract-place'?String(body.text||'').trim():String(body.name||'').trim()
  if(!query)throw new Error(action==='extract-place'?'请先粘贴待提取内容':'请先输入名称')
  if(query.length>12000)throw new Error('输入内容过长，请缩短后重试')

  const key=Deno.env.get('DEEPSEEK_API_KEY')
  if(!key)throw new Error('云端尚未配置 DEEPSEEK_API_KEY')
  const model=Deno.env.get('DEEPSEEK_MODEL')||'deepseek-v4-flash'
  const response=await fetch('https://api.deepseek.com/responses',{
   method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
   body:JSON.stringify({model,temperature:0.15,max_output_tokens:1800,tools:[{type:'web_search'}],tool_choice:{type:'web_search'},text:{format:{type:'json_object'}},instructions:promptFor(action,body),input:query})
  })
  const payload=await response.json().catch(()=>null)
  if(!response.ok)throw new Error(payload?.error?.message||`AI 请求失败（${response.status}）`)
  const text=(payload?.output||[]).flatMap((item:Record<string,unknown>)=>Array.isArray(item.content)?item.content:[]).find((item:Record<string,unknown>)=>item?.type==='output_text')?.text
  if(typeof text!=='string')throw new Error('AI 未返回结构化资料')
  return json({data:JSON.parse(text)})
 }catch(error){return json({error:error instanceof Error?error.message:'AI 服务异常'},400)}
})

function promptFor(action:string,body:Record<string,unknown>){
 const common='只使用公开可核验资料；不确定时字段留空，confidence 设为 low；禁止编造地址、交通出口、票价、营业时间、私人信息。只输出 JSON，不要 Markdown。'
 if(action==='idol-profile')return `你是循迹后台的爱豆资料研究助手。联网搜索姓名对应的公开人物资料，并输出字段 name,roles,customRoles,bio,cityNames,fanName,confidence,notice。roles 只可为 演员、歌手、偶像、主持人、导演、作家、音乐人；cityNames 只保留与公开活动、作品地点或现有地点明确相关的城市。${common}`
 if(action==='work-profile')return `你是循迹后台的作品资料研究助手。联网搜索作品名称，并输出字段 name,type,year,region,quote,relatedIdolNames,cityNames,confidence,notice。type 只能为 movie、tv、variety、book、music、other；relatedIdolNames 只写公开可确认的主创；cityNames 只写明确关联的现实城市。${common}`
 return `你是循迹后台的地点与攻略研究助手。先提取用户原文，再联网补充可公开核验的地点资料。输出字段 name,address,city,idolName,relationType,relationDescription,evidenceSource,credibility,transportGuide,coreSpots,tips,guideDraftGenerated,guideNotice。relationType 只能为 same_style、filming、public_event、personal_share、other；credibility 固定 C。攻略只能给通用导航、公开入口与核验建议；不得杜撰具体路线、出口和营业信息。${common}`
}
