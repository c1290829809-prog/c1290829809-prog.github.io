import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readServerEnv(){
 const file=resolve(process.cwd(),'.env.server.local')
 if(!existsSync(file)) return {} as Record<string,string>
 return Object.fromEntries(readFileSync(file,'utf8').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#')).map(line=>{const index=line.indexOf('=');return index<0?[line,'']:[line.slice(0,index),line.slice(index+1)]}))
}

function deepSeekProxy():Plugin{
 return {name:'xunji-deepseek-proxy',configureServer(server){
  server.middlewares.use('/api/ai/extract',async(req,res)=>{
   res.setHeader('Content-Type','application/json; charset=utf-8')
   if(req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({error:'仅支持 POST 请求'}));return}
   try{
    const chunks:Buffer[]=[];let size=0
    for await(const chunk of req){size+=chunk.length;if(size>30_000)throw new Error('输入内容过长');chunks.push(chunk)}
    const {text,idolNames=[]}=JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if(typeof text!=='string'||!text.trim())throw new Error('缺少待提取内容')
    const env=readServerEnv(),apiKey=env.AI_API_KEY,baseUrl=(env.AI_BASE_URL||'https://api.deepseek.com').replace(/\/$/,''),model=env.AI_MODEL||'deepseek-v4-flash'
    if(!apiKey)throw new Error('服务端尚未配置 AI_API_KEY')
    const prompt=`请从用户粘贴的公开社交内容中提取城市地点信息。只输出 JSON，不要解释。
JSON 字段：name, address, city, idolName, relationType, relationDescription, evidenceSource, credibility, transportGuide, coreSpots, tips。
relationType 只能是 same_style、filming、public_event、personal_share。
判断规则：节目或录制为 filming；活动或发布会为 public_event；同款或穿搭为 same_style；其他为 personal_share。
idolName 只能从这些名字中选择，未匹配则为空：${idolNames.join('、')}。
evidenceSource 为原文前 50 个汉字；credibility 固定为 C。无法识别的字段输出空字符串。`
    const strategyPrompt='transportGuide 提取地铁、公交、打车、交通相关内容；coreSpots 提取打卡点、路线、地标、位置相关内容；tips 提取最佳时间、游玩时长、避坑、注意、建议相关内容。'
    const finalPrompt=`${prompt}\n${strategyPrompt}`
    const response=await fetch(`${baseUrl}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,thinking:{type:'disabled'},response_format:{type:'json_object'},max_tokens:1000,messages:[{role:'system',content:finalPrompt},{role:'user',content:text}]})})
    const payload:any=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(payload?.error?.message||`DeepSeek 请求失败（${response.status}）`)
    const content=payload?.choices?.[0]?.message?.content
    if(!content)throw new Error('DeepSeek 未返回提取结果')
    const data=JSON.parse(content)
    res.end(JSON.stringify({data}))
   }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error instanceof Error?error.message:'AI 提取失败'}))}
  })
 }}
}

export default defineConfig({
 base:'/',
 plugins:[react(),deepSeekProxy()]
})
