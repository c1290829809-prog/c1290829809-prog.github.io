import {defineConfig,type Plugin} from 'vite'
import react from '@vitejs/plugin-react'
import {existsSync,readFileSync} from 'node:fs'
import {resolve} from 'node:path'

function readServerEnv(){
 const file=resolve(process.cwd(),'.env.server.local')
 if(!existsSync(file)) return {} as Record<string,string>
 return Object.fromEntries(
  readFileSync(file,'utf8')
   .split(/\r?\n/)
   .map(line=>line.trim())
   .filter(line=>line&&!line.startsWith('#'))
   .map(line=>{
    const index=line.indexOf('=')
    return index<0?[line,'']:[line.slice(0,index),line.slice(index+1)]
   })
 )
}

function deepSeekProxy():Plugin{
 return {
  name:'xunji-deepseek-proxy',
  configureServer(server){
   server.middlewares.use('/api/ai/extract',async(req,res)=>{
    res.setHeader('Content-Type','application/json; charset=utf-8')
    if(req.method!=='POST'){
     res.statusCode=405
     res.end(JSON.stringify({error:'仅支持 POST 请求'}))
     return
    }
    try{
     const chunks:Buffer[]=[]
     let size=0
     for await(const chunk of req){
      size+=chunk.length
      if(size>30_000) throw new Error('输入内容过长')
      chunks.push(chunk)
     }
     const {text,idolNames=[],context={},generateGuide=true}=JSON.parse(Buffer.concat(chunks).toString('utf8'))
     if(typeof text!=='string'||!text.trim()) throw new Error('缺少待提取内容')

     const env=readServerEnv()
     const apiKey=env.AI_API_KEY
     const baseUrl=(env.AI_BASE_URL||'https://api.deepseek.com').replace(/\/$/,'')
     const model=env.AI_MODEL||'deepseek-v4-flash'
     if(!apiKey) throw new Error('服务端尚未配置 AI_API_KEY')

     const systemPrompt=`你是“循迹”城市打卡产品的地点资料编辑助手。
请完成两个任务：
1. 从用户粘贴的公开内容中提取地点、城市、地址、关联人物、关系和证据。
2. ${generateGuide?'生成可编辑的攻略草稿：交通指南、核心打卡点与路线、游玩小贴士。':'只提取原文中明确出现的攻略信息。'}

只输出一个 JSON 对象，不要解释，不要 Markdown。字段必须为：
name, address, city, idolName, relationType, relationDescription, evidenceSource,
credibility, transportGuide, coreSpots, tips, guideDraftGenerated, guideNotice。

规则：
- relationType 只能是 same_style、filming、public_event、personal_share、other。
- “节目、录制、取景、拍摄”归 filming；“活动、发布会、见面会”归 public_event；
  “同款、穿搭”归 same_style；其他公开分享归 personal_share。
- idolName 优先匹配这些已有名称：${idolNames.join('、')||'无'}。也可保留原文中明确出现的新名字。
- evidenceSource 仅概括原文来源，不得编造账号、日期、节目期数或媒体名称。
- credibility 固定为 C，最终等级由人工审核。
- 已知表单上下文：地点=${context.name||'未填'}；城市=${context.city||'未填'}；地址=${context.address||'未填'}。

攻略生成安全要求：
- 原文明确写出的交通、时间、路线优先保留和整理。
- 信息不足时可以生成实用草稿，但不得杜撰具体地铁线路、出口、票价、营业时间、
  步行分钟数、预约政策或“最佳机位”等事实。
- 交通指南应说明导航方式、公共交通优先和实时核实提醒。
- 核心打卡点使用 2-4 条编号路线，围绕公开入口、主体建筑、招牌、景观和公开区域。
- 小贴士使用 3-5 条换行要点，覆盖开放/预约核实、人流、拍照秩序、隐私与安全。
- 只要任一攻略字段包含模型补写内容，guideDraftGenerated=true。
- guideNotice 固定说明“AI 生成草稿，发布前需人工核实交通、开放时间、预约要求和现场限制”。`

     const response=await fetch(`${baseUrl}/chat/completions`,{
      method:'POST',
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
       model,
       response_format:{type:'json_object'},
       max_tokens:1800,
       temperature:0.35,
       messages:[
        {role:'system',content:systemPrompt},
        {role:'user',content:text.trim()}
       ]
      })
     })
     const payload:any=await response.json().catch(()=>({}))
     if(!response.ok) throw new Error(payload?.error?.message||`DeepSeek 请求失败（${response.status}）`)
     const content=payload?.choices?.[0]?.message?.content
     if(!content) throw new Error('DeepSeek 未返回提取结果')
     res.end(JSON.stringify({data:JSON.parse(content)}))
    }catch(error){
     res.statusCode=400
     res.end(JSON.stringify({error:error instanceof Error?error.message:'AI 提取失败'}))
    }
   })
  }
 }
}

export default defineConfig({
 base:'/',
 plugins:[react(),deepSeekProxy()]
})
