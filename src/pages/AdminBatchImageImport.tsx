import {CheckCircle2,FileImage,LoaderCircle,ShieldCheck,Sparkles,Upload,AlertTriangle,X} from 'lucide-react'
import {useRef,useState} from 'react'
import {AdminShell} from './Admin'
import {extractPlacesFromImage,type BatchPlaceDraft} from '../services/aiCloud'
import {useAdminStore,useBasicDataStore,type AdminPlace} from '../stores'

type Draft=BatchPlaceDraft&{id:string;selected:boolean;duplicate:boolean}
const clean=(value:unknown)=>typeof value==='string'?value.trim():value===undefined||value===null?'':String(value).trim()
const split=(value:unknown)=>clean(value).split(/[、,，/]/).map(item=>item.trim()).filter(Boolean)
const coordinate=(value:unknown)=>{const next=Number(clean(value).replace(/[＊*]/g,''));return Number.isFinite(next)&&next!==0?next:null}
const keyFor=(row:Pick<Draft,'placeName'|'city'|'address'>)=>[row.placeName,row.city,row.address].map(value=>clean(value).toLocaleLowerCase()).join('|')
const nameKey=(value:unknown)=>clean(value).replace(/\s+/g,'').toLocaleLowerCase()
const idPart=(value:string)=>nameKey(value).replace(/[^a-z0-9\u4e00-\u9fff]/g,'').slice(0,24)||'item'
const updateField=(row:Draft,key:keyof BatchPlaceDraft,value:string):Draft=>({...row,[key]:value})

export function AdminBatchImageImportPage(){
 const inputRef=useRef<HTMLInputElement>(null)
 const records=useAdminStore(s=>s.records),addRecord=useAdminStore(s=>s.addRecord)
 const basic=useBasicDataStore()
 const[fileName,setFileName]=useState(''),[imageDataUrl,setImageDataUrl]=useState(''),[rows,setRows]=useState<Draft[]>([]),[busy,setBusy]=useState(false),[importing,setImporting]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[result,setResult]=useState('')
 const existing=new Set(records.map(item=>keyFor({placeName:item.name,city:item.city,address:item.address})))
 const pick=async(file?:File)=>{
  if(!file)return
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){setError('请选择 JPG、PNG、WebP 或 GIF 图片');return}
  if(file.size>8*1024*1024){setError('图片不能超过 8MB，请先裁剪或压缩截图');return}
  setError('');setResult('');setRows([]);setNotice('');setFileName(file.name)
  const reader=new FileReader()
  reader.onload=()=>setImageDataUrl(String(reader.result||''))
  reader.onerror=()=>setError('图片读取失败，请重新选择')
  reader.readAsDataURL(file)
 }
 const recognize=async()=>{
  if(!imageDataUrl)return
  setBusy(true);setError('');setResult('')
  try{
   const data=await extractPlacesFromImage(imageDataUrl)
   const seen=new Set(existing)
   const next=(Array.isArray(data.rows)?data.rows:[]).map((item,index)=>{
    const row={...item,id:`draft-${Date.now()}-${index}`,selected:true,duplicate:false}
    const key=keyFor(row)
    row.duplicate=seen.has(key)
    row.selected=!row.duplicate
    seen.add(key)
    return row
   })
   if(!next.length)throw new Error('没有从图片中识别到可导入的地点，请换一张清晰的表格截图')
   setRows(next);setNotice(data.notice||'请逐条核对后再导入。识别内容均为待审核草稿。')
  }catch(reason){setError(reason instanceof Error?reason.message:'图片识别失败，请稍后重试')}
  finally{setBusy(false)}
 }
 const setRow=(id:string,change:(row:Draft)=>Draft)=>setRows(current=>current.map(row=>row.id===id?change(row):row))
 const selected=rows.filter(row=>row.selected&&!row.duplicate&&clean(row.placeName)&&clean(row.city)&&clean(row.address))
 const missingCore=rows.filter(row=>row.selected&&!row.duplicate&&(!clean(row.placeName)||!clean(row.city)||!clean(row.address))).length
 const importRows=async()=>{
  if(!selected.length){setError('请至少保留一条名称、城市和地址完整的记录');return}
  if(!confirm(`确认把 ${selected.length} 条已核对的地点导入云端待审核队列吗？它们不会直接发布到前台。`))return
  setImporting(true);setError('');let imported=0;const failed:string[]=[]
  const knownCities=new Set(basic.cities.map(city=>city.name.toLocaleLowerCase()))
  const citiesByName=new Map(basic.cities.map(city=>[nameKey(city.name),city]))
  const idolsByName=new Map(basic.idols.map(idol=>[nameKey(idol.name),idol]))
  const worksByName=new Map(basic.works.map(work=>[nameKey(work.name),work]))
  const importedKeys=new Set(existing)
  for(const row of selected){
   try{
    const city=clean(row.city),cityKey=city.toLocaleLowerCase()
    const placeKey=keyFor(row)
    if(importedKeys.has(placeKey)){failed.push(`${clean(row.placeName)}（重复）`);continue}
    let cityRecord=citiesByName.get(nameKey(city))
    if(!knownCities.has(cityKey)){
     const region=city==='深圳'?'广东省':city==='上海'?'上海市':city==='重庆'?'重庆市':city==='北京'?'北京市':'待补充'
     cityRecord={id:`city-auto-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:city,region,cover:'',story:'',iconUrl:'',placeCount:0,routeCount:0,autoCreated:true,createdAt:new Date().toISOString()}
     const created=await basic.addCity(cityRecord)
     if(!created)throw new Error('城市资料创建失败')
     knownCities.add(cityKey)
     citiesByName.set(nameKey(city),cityRecord)
    }
    const lat=coordinate(row.lat),lng=coordinate(row.lng)
    const works=split(row.relatedWorks),people=split(row.relatedPeople)
    const idolIds:string[]=[]
    for(const name of people){
     const key=nameKey(name);let idol=idolsByName.get(key)
     if(!idol){
      idol={id:`idol-import-${idPart(name)}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name,avatar:'',roles:[],bio:'由图片批量识别自动创建，待补充公开资料。',cities:cityRecord?[cityRecord.id]:[],cityNames:[city],placeCount:0,createdAt:new Date().toISOString()}
      if(!await basic.addIdol(idol))throw new Error(`爱豆“${name}”创建失败`)
      idolsByName.set(key,idol)
     }
     idolIds.push(idol.id)
    }
    const workIds:string[]=[]
    for(const name of works){
     const key=nameKey(name);let work=worksByName.get(key)
     if(!work){
      work={id:`work-import-${idPart(name)}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name,type:'other',cover:'',quote:'由图片批量识别自动创建，待补充公开资料。',relatedIdolIds:idolIds,relatedIdolNames:people,relatedCities:cityRecord?[cityRecord.id]:[],cityNames:[city],placeCount:0,createdAt:new Date().toISOString()}
      if(!await basic.addWork(work))throw new Error(`作品“${name}”创建失败`)
      worksByName.set(key,work)
     }
     workIds.push(work.id)
    }
    const content=[clean(row.type),clean(row.relation)].filter(Boolean).join(' · ')
    const source=clean(row.source)||'图片批量识别录入，待人工核验原始资料'
    const record:AdminPlace={
     id:`place-import-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
     name:clean(row.placeName),city,address:clean(row.address),lng:lng??0,lat:lat??0,coordinatesPending:lat===null||lng===null,
     openTime:'待核实',visitable:'unknown',images:[],relatedIdols:people,relatedIdolNames:people,relatedIdolIds:idolIds,relatedMovies:works,relatedVariety:[],relatedTV:[],relatedOtherWorks:[],relatedWorkIds:workIds,relationType:'filming',relationDesc:content||'来源表格中的关联关系，待人工核验',evidence:source,credibility:null,status:'pending',createdAt:new Date().toISOString()
    }
    if(!await addRecord(record))throw new Error('地点保存失败')
    importedKeys.add(placeKey)
    imported++
   }catch{failed.push(clean(row.placeName)||'未命名地点')}
  }
  setImporting(false)
  setRows(current=>current.map(row=>selected.some(item=>item.id===row.id)?{...row,selected:false}:row))
  setResult(`已导入 ${imported} 条待审核草稿${failed.length?`；${failed.length} 条未成功：${failed.join('、')}`:''}。请到“审核流程”逐条核验后发布。`)
 }
 return <AdminShell title="图片批量识别录入" subtitle="上传表格截图，AI 识别为可编辑草稿；确认后才写入 Supabase 云端">
  <section className="mx-auto max-w-6xl space-y-6">
   <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={20}/><p><b>识别不等于验证。</b>截图中的星级、关系与坐标都会作为草稿导入；没有坐标的记录会被锁定在待审核状态，补齐经纬度前不能发布。请勿上传含有私人地址、身份证件或未公开个人信息的图片。</p></div></div>
   <section className="rounded-2xl bg-white p-8 shadow-sm"><div className="flex items-start justify-between gap-6"><div><h2 className="flex items-center gap-3 text-xl font-black"><Sparkles className="text-orange-500"/>1. 上传表格截图</h2><p className="mt-2 text-sm text-slate-500">支持 JPG、PNG、WebP、GIF，单张不超过 8MB。截图不会保存到你的内容库。</p></div>{fileName&&<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{fileName}</span>}</div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={event=>void pick(event.target.files?.[0])}/>
    <button type="button" onClick={()=>inputRef.current?.click()} className="mt-6 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 transition hover:border-orange-400 hover:bg-orange-50"><Upload size={24}/><b className="mt-3">选择表格截图</b><span className="mt-1 text-xs text-slate-400">清晰截图识别效果更好</span></button>
    {imageDataUrl&&<div className="mt-5 flex items-center gap-5 rounded-xl border border-slate-200 p-3"><img src={imageDataUrl} alt="待识别表格" className="h-28 w-40 rounded-lg object-cover"/><div className="min-w-0 flex-1"><p className="font-bold">已准备好识别</p><p className="mt-1 text-sm text-slate-500">AI 将读取表格中的地点、地址、坐标、关联人物/作品与关系。</p></div><button type="button" onClick={()=>void recognize()} disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={18}/>:<FileImage size={18}/>}{busy?'正在识别…':'开始识别'}</button></div>}
   </section>
   {error&&<div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertTriangle size={19}/>{error}</div>}
   {notice&&<div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{notice}</div>}
   {rows.length>0&&<section className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="flex items-center justify-between gap-6 border-b border-slate-100 p-6"><div><h2 className="text-xl font-black">2. 核对识别结果</h2><p className="mt-1 text-sm text-slate-500">勾选的完整记录会进入待审核队列，不会直接对外展示。</p></div><span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">待导入 {selected.length} 条</span></div>
    {missingCore>0&&<p className="mx-6 mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">有 {missingCore} 条缺少名称、城市或地址，补全后才可以导入。</p>}
    <div className="overflow-x-auto"><table className="min-w-[1200px] w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="w-14 px-5 py-4">导入</th><th>地点 / 城市</th><th>地址</th><th>关联人物 / 作品</th><th>纬度 / 经度</th><th>关系与来源</th><th className="pr-5">操作</th></tr></thead><tbody>{rows.map(row=>{const incomplete=!clean(row.placeName)||!clean(row.city)||!clean(row.address);const noCoords=coordinate(row.lat)===null||coordinate(row.lng)===null;return <tr key={row.id} className={`border-t border-slate-100 align-top ${row.duplicate?'bg-slate-50 opacity-60':''}`}><td className="px-5 py-5"><input type="checkbox" checked={row.selected} disabled={row.duplicate} onChange={event=>setRow(row.id,current=>({...current,selected:event.target.checked}))} className="h-4 w-4 accent-orange-500"/></td><td className="py-4 pr-3"><Cell value={clean(row.placeName)} placeholder="地点名称 *" onChange={value=>setRow(row.id,current=>updateField(current,'placeName',value))}/><Cell value={clean(row.city)} placeholder="城市 *" onChange={value=>setRow(row.id,current=>updateField(current,'city',value))}/>{row.district&&<p className="mt-1 text-xs text-slate-400">{row.district}</p>}</td><td className="py-4 pr-3"><Cell value={clean(row.address)} placeholder="详细地址 *" multiline onChange={value=>setRow(row.id,current=>updateField(current,'address',value))}/></td><td className="py-4 pr-3"><Cell value={clean(row.relatedPeople)} placeholder="关联人物" onChange={value=>setRow(row.id,current=>updateField(current,'relatedPeople',value))}/><Cell value={clean(row.relatedWorks)} placeholder="关联作品" onChange={value=>setRow(row.id,current=>updateField(current,'relatedWorks',value))}/></td><td className="py-4 pr-3"><Cell value={clean(row.lat)} placeholder="待补充" onChange={value=>setRow(row.id,current=>updateField(current,'lat',value))}/><Cell value={clean(row.lng)} placeholder="待补充" onChange={value=>setRow(row.id,current=>updateField(current,'lng',value))}/>{noCoords&&<span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">需补坐标</span>}</td><td className="py-4 pr-3"><Cell value={clean(row.relation)} placeholder="关联关系" multiline onChange={value=>setRow(row.id,current=>updateField(current,'relation',value))}/><Cell value={clean(row.source)} placeholder="资料来源" multiline onChange={value=>setRow(row.id,current=>updateField(current,'source',value))}/></td><td className="py-4 pr-5">{row.duplicate?<span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">已存在</span>:incomplete?<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">信息不完整</span>:<span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">待审核</span>}<button type="button" aria-label="移除此条" onClick={()=>setRows(current=>current.filter(item=>item.id!==row.id))} className="mt-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={17}/></button></td></tr>})}</tbody></table></div>
    <div className="flex items-center justify-between gap-5 border-t border-slate-100 p-6"><p className="text-xs leading-5 text-slate-500">导入时会自动建立尚不存在的城市、爱豆与作品，并关联到地点；自动创建的资料会标记为“待补充公开资料”。系统会按地点名称、城市和地址拦截已有记录及本次图片内的重复行。</p><button type="button" onClick={()=>void importRows()} disabled={importing||!selected.length} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-6 font-bold text-white disabled:opacity-50">{importing?<LoaderCircle className="animate-spin" size={18}/>:<CheckCircle2 size={18}/>}{importing?'正在写入云端…':`确认导入 ${selected.length} 条`}</button></div>
   </section>}
   {result&&<div role="status" className="rounded-xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">{result}</div>}
  </section>
 </AdminShell>
}

function Cell({value,placeholder,onChange,multiline=false}:{value:string;placeholder:string;onChange:(value:string)=>void;multiline?:boolean}){
 const className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-orange-400"
 return multiline?<textarea value={value} placeholder={placeholder} onChange={event=>onChange(event.target.value)} rows={2} className={className}/>:<input value={value} placeholder={placeholder} onChange={event=>onChange(event.target.value)} className={className}/>
}
