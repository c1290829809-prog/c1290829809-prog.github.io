import {FormEvent,useEffect,useState} from 'react'
import {Check,Edit3,ExternalLink,Image,MapPin,Plus,Search,Sparkles,Trash2,X} from 'lucide-react'
import {Link,useNavigate,useParams,useSearchParams} from 'react-router-dom'
import {AdminShell} from './Admin'
import {recalculateBasicCounts,useAdminStore,useBasicDataStore,type AdminPlace,type ManagedCity,type ManagedIdol,type ManagedWork,type WorkType} from '../stores'
import {generateIdolProfile,type IdolProfileDraft} from '../services/aiIdolProfile'
import {generateWorkProfile,type WorkProfileDraft} from '../services/aiWorkProfile'

const control='min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
const roles=['演员','歌手','偶像','主持人','导演','作家','音乐人']
const types:Record<WorkType,string>={movie:'电影',tv:'电视剧',variety:'综艺',book:'书籍',music:'音乐',other:'其他'}
const now=()=>new Date().toISOString()
const id=()=>`${Date.now()}-${Math.random().toString(36).slice(2,7)}`
const toggle=(values:string[],value:string)=>values.includes(value)?values.filter(x=>x!==value):[...values,value]
const placeWorkNames=(place:AdminPlace)=>[...place.relatedMovies,...place.relatedTV,...place.relatedVariety,...(place.relatedOtherWorks||[])]
const placeHasWork=(place:AdminPlace,workId:string,workName:string)=>(place.relatedWorkIds||[]).includes(workId)||placeWorkNames(place).includes(workName)
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label>}
function DraftItem({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-white/80 p-4"><p className="text-xs font-semibold text-amber-700">{label}</p><p className="mt-1 whitespace-pre-line leading-6 text-slate-800">{value||'未能可靠识别，请手动填写'}</p></div>}
function Checks({items,value,onChange}:{items:{id:string;name:string}[];value:string[];onChange:(next:string[])=>void}){return <div className="grid grid-cols-3 gap-2">{items.map(item=><label key={item.id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${value.includes(item.id)?'border-red-400 bg-red-50 text-red-700':'border-slate-200'}`}><input type="checkbox" checked={value.includes(item.id)} onChange={()=>onChange(toggle(value,item.id))}/>{item.name}</label>)}</div>}
function Actions({edit,remove}:{edit:string;remove:()=>void}){return <div className="flex justify-end"><Link to={edit} className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-blue-600"><Edit3 size={18}/></Link><button onClick={remove} className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-red-600"><Trash2 size={18}/></button></div>}
function ImageCell({url,name}:{url:string;name:string}){return url?<img src={url} alt={name} className="h-12 w-12 rounded-xl object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Image size={20}/></div>}

export function AdminIdolFormPage(){
 const store=useBasicDataStore(),[params]=useSearchParams(),routeParams=useParams(),edit=store.idols.find(x=>x.id===(routeParams.id||params.get('edit'))),navigate=useNavigate()
 const places=useAdminStore(state=>state.records),updatePlace=useAdminStore(state=>state.updateRecord)
 const existingCustom=(edit?.roles||[]).filter(role=>!roles.includes(role))
 const existingCityNames=edit?.cityNames?.length?edit.cityNames:(edit?.cities||[]).map(cityId=>store.cities.find(city=>city.id===cityId)?.name).filter(Boolean) as string[]
 const initialPlaceIds=edit?places.filter(place=>(place.relatedIdolIds||[]).includes(edit.id)||(place.relatedIdolNames||place.relatedIdols).includes(edit.name)).map(place=>place.id):[]
 const[form,setForm]=useState(()=>({name:edit?.name||'',avatar:edit?.avatar||'',roles:(edit?.roles||[]).filter(role=>roles.includes(role)),customRole:existingCustom.join('，'),useCustom:existingCustom.length>0,bio:edit?.bio||'',cityText:existingCityNames.join('，'),fanName:edit?.fanName||''}))
 const[aiLoading,setAiLoading]=useState(false),[aiDraft,setAiDraft]=useState<IdolProfileDraft|null>(null),[aiError,setAiError]=useState('')
 const[selectedPlaceIds,setSelectedPlaceIds]=useState<string[]>(initialPlaceIds),[placeQuery,setPlaceQuery]=useState('')
 const split=(value:string)=>value.split(/[,，]/).map(item=>item.trim()).filter(Boolean)
 const togglePlace=(placeId:string)=>{
  const previousCities=new Set(places.filter(place=>selectedPlaceIds.includes(place.id)).map(place=>place.city).filter(Boolean))
  const nextIds=selectedPlaceIds.includes(placeId)?selectedPlaceIds.filter(id=>id!==placeId):[...selectedPlaceIds,placeId]
  const manualCities=split(form.cityText).filter(city=>!previousCities.has(city))
  const nextCities=places.filter(place=>nextIds.includes(place.id)).map(place=>place.city).filter(Boolean)
  setSelectedPlaceIds(nextIds)
  setForm({...form,cityText:[...new Set([...manualCities,...nextCities])].join('，')})
 }
 const generate=async()=>{
  if(!form.name.trim()){setAiError('请先填写爱豆名称');return}
  setAiLoading(true);setAiError('');setAiDraft(null)
  try{
   setAiDraft(await generateIdolProfile(form.name,{
    roles:[...form.roles,...(form.useCustom?split(form.customRole):[])],
    bio:form.bio,
    cityNames:split(form.cityText),
    fanName:form.fanName,
    availableCities:store.cities.map(city=>city.name)
   }))
  }catch(error){setAiError(error instanceof Error?error.message:'AI 资料补全失败，请稍后重试')}
  finally{setAiLoading(false)}
 }
 const applyDraft=()=>{
  if(!aiDraft)return
  const cityNames=[...new Set([...split(form.cityText),...aiDraft.cityNames])]
  const nextRoles=[...new Set([...form.roles,...aiDraft.roles])]
  const nextCustom=[...new Set([...split(form.customRole),...aiDraft.customRoles])]
  setForm({
   ...form,
   roles:nextRoles,
   customRole:nextCustom.join('，'),
   useCustom:nextCustom.length>0,
   bio:form.bio.trim()?form.bio:aiDraft.bio,
   cityText:cityNames.join('，'),
   fanName:form.fanName.trim()?form.fanName:aiDraft.fanName
  })
  setAiDraft(null)
 }
 const submit=(e:FormEvent)=>{
  e.preventDefault()
  const idolId=edit?.id||`idol-${id()}`
  const idolName=form.name.trim()
  const placeCities=places.filter(place=>selectedPlaceIds.includes(place.id)).map(place=>place.city).filter(Boolean)
  const cityNames=[...new Set([...split(form.cityText),...placeCities])]
  const cityIds=cityNames.map(name=>store.cities.find(city=>city.name.toLowerCase()===name.toLowerCase())?.id).filter(Boolean) as string[]
  const customRoles=form.useCustom?split(form.customRole):[]
  const value:ManagedIdol={
   id:idolId,
   name:idolName,
   avatar:form.avatar.trim(),
   roles:[...new Set([...form.roles,...customRoles])],
   bio:form.bio.trim(),
   cities:cityIds,
   cityNames,
   fanName:form.fanName.trim()||undefined,
   placeCount:places.filter(place=>selectedPlaceIds.includes(place.id)&&place.status==='published').length,
   createdAt:edit?.createdAt||now()
  }
  edit?store.updateIdol(edit.id,value):store.addIdol(value)
  places.forEach(place=>{
   const names=place.relatedIdolNames||place.relatedIdols
   const wasRelated=(place.relatedIdolIds||[]).includes(idolId)||(edit?names.includes(edit.name):false)
   const selected=selectedPlaceIds.includes(place.id)
   if(!selected&&!wasRelated)return
   const cleanedIds=(place.relatedIdolIds||[]).filter(currentId=>currentId!==idolId)
   const cleanedNames=names.filter(name=>name!==idolName&&name!==edit?.name)
   const relatedIdolIds=selected?[...new Set([...cleanedIds,idolId])]:cleanedIds
   const relatedIdolNames=selected?[...new Set([...cleanedNames,idolName])]:cleanedNames
   updatePlace(place.id,{relatedIdolIds,relatedIdolNames,relatedIdols:relatedIdolNames})
  })
  navigate('/admin/idol/list')
 }
 const normalizedQuery=placeQuery.trim().toLowerCase()
 const visiblePlaces=places.filter(place=>!normalizedQuery||[place.name,place.city,place.address].some(value=>value.toLowerCase().includes(normalizedQuery)))
 return <AdminShell title={edit?'编辑爱豆':'录入爱豆'} subtitle="维护地点可关联的爱豆基础资料">
  <form onSubmit={submit} className="max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
   <div className="grid grid-cols-2 gap-6">
    <Field label="爱豆名称 *"><input required className={control} value={form.name} onChange={e=>{setForm({...form,name:e.target.value});setAiDraft(null);setAiError('')}}/></Field>
    <Field label="头像 URL（选填）"><input className={control} value={form.avatar} onChange={e=>setForm({...form,avatar:e.target.value})}/></Field>
   </div>
   <section className="mt-6 rounded-2xl bg-slate-950 p-6 text-white">
    <div className="flex items-center justify-between gap-6">
     <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500"><Sparkles size={20}/></span><div><h2 className="font-black">AI 补全爱豆资料</h2><p className="mt-1 text-sm text-white/55">根据名称生成身份、简介、粉丝昵称和关联城市建议</p></div></div>
     <button type="button" onClick={generate} disabled={aiLoading||!form.name.trim()} className="min-h-12 rounded-xl bg-orange-500 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-45">{aiLoading?'生成中...':'AI 自动补全'}</button>
    </div>
    <p className="mt-4 text-xs leading-5 text-white/45">头像 URL 不会由 AI 编造；所有人物资料都需在保存前对照官方主页或可靠公开资料核实。</p>
    {aiError&&<p className="mt-3 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{aiError}</p>}
   </section>
   {aiDraft&&<section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
    <div className="flex items-start justify-between gap-6">
     <div className="min-w-0 flex-1"><div className="flex items-center gap-3"><h3 className="font-black text-amber-950">AI 资料草稿</h3><span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">可信度：{{high:'高',medium:'中',low:'低'}[aiDraft.confidence]}</span></div><p className="mt-3 text-xs leading-5 text-amber-800">{aiDraft.notice}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm"><DraftItem label="身份标签" value={[...aiDraft.roles,...aiDraft.customRoles].join('、')}/><DraftItem label="粉丝昵称" value={aiDraft.fanName}/><DraftItem label="关联城市建议" value={aiDraft.cityNames.join('、')}/><div className="col-span-2"><DraftItem label="简介" value={aiDraft.bio}/></div></div>
     </div>
     <button type="button" onClick={applyDraft} className="min-h-12 shrink-0 rounded-xl bg-slate-950 px-6 font-bold text-white">应用建议</button>
    </div>
   </section>}
   <div className="mt-6 grid grid-cols-2 gap-6">
    <div className="col-span-2"><Field label="身份标签"><div className="flex flex-wrap gap-2">{roles.map(role=><label key={role} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3"><input type="checkbox" checked={form.roles.includes(role)} onChange={()=>setForm({...form,roles:toggle(form.roles,role)})}/>{role}</label>)}<label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3"><input type="checkbox" checked={form.useCustom} onChange={()=>setForm({...form,useCustom:!form.useCustom})}/>其他</label></div>{form.useCustom&&<input className={`${control} mt-3`} value={form.customRole} onChange={e=>setForm({...form,customRole:e.target.value})} placeholder="自己填写身份，多个用逗号分隔，例如：舞者、制作人"/>}</Field></div>
    <div className="col-span-2"><Field label="简介"><textarea rows={4} className={`${control} py-3`} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></Field></div>
    <div className="col-span-2"><Field label="关联城市"><input list="city-suggestions" className={control} value={form.cityText} onChange={e=>setForm({...form,cityText:e.target.value})} placeholder="输入或选择城市，多个用逗号分隔，例如：深圳、首尔、东京"/><datalist id="city-suggestions">{store.cities.map(city=><option key={city.id} value={city.name}/>)}</datalist><p className="mt-2 font-normal text-slate-400">会自动识别已有城市；也可以直接填写新城市，不限制数量。</p></Field></div>
    <section className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
     <div className="flex items-start justify-between gap-6"><div><h3 className="font-bold text-slate-800">关联地点 <span className="ml-1 text-orange-600">{selectedPlaceIds.length}</span></h3><p className="mt-1 text-xs leading-5 text-slate-500">选择后会同步更新地点的爱豆关联，并自动把地点所在城市加入关联城市。</p></div>{selectedPlaceIds.length>0&&<button type="button" onClick={()=>{const previousCities=new Set(places.filter(place=>selectedPlaceIds.includes(place.id)).map(place=>place.city));setSelectedPlaceIds([]);setForm({...form,cityText:split(form.cityText).filter(city=>!previousCities.has(city)).join('，')})}} className="min-h-11 shrink-0 px-3 text-sm font-semibold text-slate-500 hover:text-red-600">清空选择</button>}</div>
     <div className="relative mt-4"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={placeQuery} onChange={event=>setPlaceQuery(event.target.value)} className={`${control} pl-11`} placeholder="搜索地点名称、城市或地址" aria-label="搜索可关联地点"/></div>
     {visiblePlaces.length?<div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1">{visiblePlaces.map(place=>{const selected=selectedPlaceIds.includes(place.id);return <button type="button" key={place.id} aria-pressed={selected} onClick={()=>togglePlace(place.id)} className={`flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[.99] ${selected?'border-orange-400 bg-orange-50 shadow-sm':'border-slate-200 bg-white hover:border-slate-300'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${selected?'border-orange-500 bg-orange-500 text-white':'border-slate-300 bg-white text-transparent'}`}><Check size={16}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{place.name}</strong><span className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={13}/>{place.city} · {place.address}</span></span><span className={`shrink-0 text-xs font-semibold ${place.status==='published'?'text-emerald-700':place.status==='pending'?'text-amber-700':'text-red-700'}`}>{place.status==='published'?'已发布':place.status==='pending'?'待审核':'已驳回'}</span></button>})}</div>:<div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center"><MapPin className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm text-slate-500">{places.length?'没有匹配的地点':'还没有可关联的地点'}</p>{!places.length&&<Link to="/admin/place/new" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-orange-600">先去录入地点</Link>}</div>}
    </section>
    <Field label="粉丝昵称（选填）"><input className={control} value={form.fanName} onChange={e=>setForm({...form,fanName:e.target.value})}/></Field>
   </div>
   <Submit cancel="/admin/idol/list"/>
  </form>
 </AdminShell>
}
export function AdminIdolListPage(){
 const store=useBasicDataStore(),places=useAdminStore(s=>s.records),[query,setQuery]=useState(''),[selected,setSelected]=useState<{id:string;name:string}|null>(null)
 useEffect(()=>recalculateBasicCounts(places),[places])
 const rows=store.idols.filter(x=>x.name.toLowerCase().includes(query.toLowerCase()))
 const count=(idol:ManagedIdol)=>places.filter(place=>place.status==='published'&&((place.relatedIdolIds||[]).includes(idol.id)||(place.relatedIdolNames||place.relatedIdols).includes(idol.name))).length
 return <AdminShell title="爱豆管理" subtitle="搜索、编辑和维护爱豆资料"><Toolbar query={query} setQuery={setQuery} add="/admin/idol" label="录入爱豆"/><Table heads={['头像','名称','身份','关联城市数','关联地点数','操作']}>{rows.map(x=>{const value=count(x);return <tr key={x.id} className="border-t border-slate-100"><td className="px-6 py-4"><ImageCell url={x.avatar} name={x.name}/></td><td className="font-bold">{x.name}</td><td>{x.roles.join('、')||'—'}</td><td>{new Set([...(x.cityNames||[]),...x.cities]).size}</td><td><CountButton value={value} onClick={()=>setSelected({id:x.id,name:x.name})}/></td><td className="pr-6"><Actions edit={`/admin/idol/${x.id}/edit`} remove={()=>confirm(`确定删除“${x.name}”吗？`)&&store.removeIdol(x.id)}/></td></tr>})}</Table>{selected&&<RelationPlacesModal kind="idol" entity={selected} places={places} onClose={()=>setSelected(null)}/>}</AdminShell>
}

export function AdminWorkFormPage(){
 const store=useBasicDataStore(),[params]=useSearchParams(),edit=store.works.find(x=>x.id===params.get('edit')),navigate=useNavigate()
 const places=useAdminStore(state=>state.records),updatePlace=useAdminStore(state=>state.updateRecord)
 const split=(value:string)=>value.split(/[,，]/).map(item=>item.trim()).filter(Boolean)
 const existingIdolNames=edit?.relatedIdolNames?.length?edit.relatedIdolNames:(edit?.relatedIdolIds||[]).map(id=>store.idols.find(idol=>idol.id===id)?.name).filter(Boolean) as string[]
 const existingCityNames=edit?.cityNames?.length?edit.cityNames:(edit?.relatedCities||[]).map(id=>store.cities.find(city=>city.id===id)?.name).filter(Boolean) as string[]
 const initialPlaceIds=edit?places.filter(place=>placeHasWork(place,edit.id,edit.name)).map(place=>place.id):[]
 const[form,setForm]=useState(()=>({name:edit?.name||'',type:edit?.type||'movie' as WorkType,year:edit?.year?String(edit.year):'',region:edit?.region||'',cover:edit?.cover||'',quote:edit?.quote||'',relatedIdolText:existingIdolNames.join('，'),cityText:existingCityNames.join('，')}))
 const[aiLoading,setAiLoading]=useState(false),[aiDraft,setAiDraft]=useState<WorkProfileDraft|null>(null),[aiError,setAiError]=useState('')
 const[selectedPlaceIds,setSelectedPlaceIds]=useState<string[]>(initialPlaceIds),[placeQuery,setPlaceQuery]=useState('')
 const idolNames=split(form.relatedIdolText),newIdolNames=idolNames.filter(name=>!store.idols.some(idol=>idol.name.toLowerCase()===name.toLowerCase()))
 const togglePlace=(placeId:string)=>{
  const previousCities=new Set(places.filter(place=>selectedPlaceIds.includes(place.id)).map(place=>place.city).filter(Boolean))
  const nextIds=selectedPlaceIds.includes(placeId)?selectedPlaceIds.filter(id=>id!==placeId):[...selectedPlaceIds,placeId]
  const manualCities=split(form.cityText).filter(city=>!previousCities.has(city))
  const nextCities=places.filter(place=>nextIds.includes(place.id)).map(place=>place.city).filter(Boolean)
  setSelectedPlaceIds(nextIds)
  setForm({...form,cityText:[...new Set([...manualCities,...nextCities])].join('，')})
 }
 const generate=async()=>{
  if(!form.name.trim()){setAiError('请先填写作品名称');return}
  setAiLoading(true);setAiError('');setAiDraft(null)
  try{
   setAiDraft(await generateWorkProfile(form.name,{
    type:form.type,
    year:form.year?Number(form.year):undefined,
    region:form.region,
    quote:form.quote,
    relatedIdolNames:idolNames,
    cityNames:split(form.cityText),
    availableIdols:store.idols.map(idol=>idol.name),
    availableCities:store.cities.map(city=>city.name)
   }))
  }catch(error){setAiError(error instanceof Error?error.message:'AI 作品资料补全失败，请稍后重试')}
  finally{setAiLoading(false)}
 }
 const applyDraft=()=>{
  if(!aiDraft)return
  setForm({
   ...form,
   type:aiDraft.type,
   year:aiDraft.year?String(aiDraft.year):form.year,
   region:aiDraft.region||form.region,
   quote:aiDraft.quote||form.quote,
   relatedIdolText:[...new Set([...idolNames,...aiDraft.relatedIdolNames])].join('，'),
   cityText:[...new Set([...split(form.cityText),...aiDraft.cityNames])].join('，')
  })
  setAiDraft(null)
 }
 const submit=(e:FormEvent)=>{
  e.preventDefault()
  const workId=edit?.id||`work-${id()}`
  const workName=form.name.trim()
  const placeCities=places.filter(place=>selectedPlaceIds.includes(place.id)).map(place=>place.city).filter(Boolean)
  const cityNames=[...new Set([...split(form.cityText),...placeCities])]
  const relatedCities=cityNames.map(name=>store.cities.find(city=>city.name.toLowerCase()===name.toLowerCase())?.id).filter(Boolean) as string[]
  const relatedIdolNames=[...new Set(idolNames)]
  const relatedIdolIds=relatedIdolNames.map(name=>{
   const existing=store.idols.find(idol=>idol.name.toLowerCase()===name.toLowerCase())
   if(existing)return existing.id
   const idolId=`idol-${id()}`
   store.addIdol({id:idolId,name,avatar:'',roles:[],bio:'',cities:[],cityNames:[],fanName:'',placeCount:0,createdAt:now()})
   return idolId
  })
  const value:ManagedWork={
   id:workId,
   name:workName,
   type:form.type,
   year:form.year?Number(form.year):undefined,
   region:form.region.trim()||undefined,
   cover:form.cover.trim(),
   quote:form.quote.trim(),
   relatedIdolIds,
   relatedIdolNames,
   relatedCities,
   cityNames,
   placeCount:places.filter(place=>selectedPlaceIds.includes(place.id)&&place.status==='published').length,
   createdAt:edit?.createdAt||now()
  }
  edit?store.updateWork(edit.id,value):store.addWork(value)
  places.forEach(place=>{
   const wasRelated=placeHasWork(place,workId,edit?.name||workName)
   const selected=selectedPlaceIds.includes(place.id)
   if(!selected&&!wasRelated)return
   const oldNames=new Set([workName,edit?.name].filter(Boolean) as string[])
   const relatedMovies=place.relatedMovies.filter(name=>!oldNames.has(name))
   const relatedTV=place.relatedTV.filter(name=>!oldNames.has(name))
   const relatedVariety=place.relatedVariety.filter(name=>!oldNames.has(name))
   const relatedOtherWorks=(place.relatedOtherWorks||[]).filter(name=>!oldNames.has(name))
   if(selected){
    if(form.type==='movie')relatedMovies.push(workName)
    else if(form.type==='tv')relatedTV.push(workName)
    else if(form.type==='variety')relatedVariety.push(workName)
    else relatedOtherWorks.push(workName)
   }
   const cleanIds=(place.relatedWorkIds||[]).filter(currentId=>currentId!==workId)
   updatePlace(place.id,{relatedMovies:[...new Set(relatedMovies)],relatedTV:[...new Set(relatedTV)],relatedVariety:[...new Set(relatedVariety)],relatedOtherWorks:[...new Set(relatedOtherWorks)],relatedWorkIds:selected?[...cleanIds,workId]:cleanIds})
  })
  navigate('/admin/work/list')
 }
 const normalizedQuery=placeQuery.trim().toLowerCase()
 const visiblePlaces=places.filter(place=>!normalizedQuery||[place.name,place.city,place.address].some(value=>value.toLowerCase().includes(normalizedQuery)))
 return <AdminShell title={edit?'编辑作品':'录入作品'} subtitle="维护电影、剧集、综艺、书籍与音乐资料">
  <form onSubmit={submit} className="max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
   <div className="grid grid-cols-2 gap-6"><Field label="作品名称 *"><input required className={control} value={form.name} onChange={event=>{setForm({...form,name:event.target.value});setAiDraft(null);setAiError('')}}/></Field><Field label="类型 *"><select required className={control} value={form.type} onChange={event=>setForm({...form,type:event.target.value as WorkType})}>{Object.entries(types).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></Field></div>
   <section className="mt-6 rounded-2xl bg-slate-950 p-6 text-white"><div className="flex items-center justify-between gap-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500"><Sparkles size={20}/></span><div><h2 className="font-black">AI 补全作品资料</h2><p className="mt-1 text-sm text-white/55">根据名称生成类型、年份、地区、简介和关联建议</p></div></div><button type="button" onClick={generate} disabled={aiLoading||!form.name.trim()} className="min-h-12 rounded-xl bg-orange-500 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-45">{aiLoading?'生成中...':'AI 自动补全'}</button></div><p className="mt-4 text-xs leading-5 text-white/45">AI 不生成封面 URL；作品年份、人物和城市关联需在保存前核实。</p>{aiError&&<p className="mt-3 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{aiError}</p>}</section>
   {aiDraft&&<section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6"><div className="flex items-start justify-between gap-6"><div className="min-w-0 flex-1"><div className="flex items-center gap-3"><h3 className="font-black text-amber-950">AI 作品草稿</h3><span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">可信度：{{high:'高',medium:'中',low:'低'}[aiDraft.confidence]}</span></div><p className="mt-3 text-xs leading-5 text-amber-800">{aiDraft.notice}</p><div className="mt-4 grid grid-cols-2 gap-4 text-sm"><DraftItem label="类型与年份" value={`${types[aiDraft.type]}${aiDraft.year?` · ${aiDraft.year}`:''}`}/><DraftItem label="地区" value={aiDraft.region}/><DraftItem label="关联人物建议" value={aiDraft.relatedIdolNames.join('、')}/><DraftItem label="关联城市建议" value={aiDraft.cityNames.join('、')}/><div className="col-span-2"><DraftItem label="一句话简介" value={aiDraft.quote}/></div></div></div><button type="button" onClick={applyDraft} className="min-h-12 shrink-0 rounded-xl bg-slate-950 px-6 font-bold text-white">应用建议</button></div></section>}
   <div className="mt-6 grid grid-cols-2 gap-6">
    <Field label="年份（选填）"><input type="number" min="1800" max="2100" className={control} value={form.year} onChange={event=>setForm({...form,year:event.target.value})}/></Field><Field label="地区（选填）"><input className={control} value={form.region} onChange={event=>setForm({...form,region:event.target.value})}/></Field>
    <div className="col-span-2"><Field label="封面 URL（选填）"><input className={control} value={form.cover} onChange={event=>setForm({...form,cover:event.target.value})}/></Field></div>
    <div className="col-span-2"><Field label="一句话简介 *"><input required className={control} value={form.quote} onChange={event=>setForm({...form,quote:event.target.value})}/></Field></div>
    <div className="col-span-2"><Field label="关联爱豆（选填）"><input list="work-idol-suggestions" className={control} value={form.relatedIdolText} onChange={event=>setForm({...form,relatedIdolText:event.target.value})} placeholder="输入爱豆名称，多个用逗号分隔；可选择已有爱豆，也可直接输入新名字"/><datalist id="work-idol-suggestions">{store.idols.map(idol=><option key={idol.id} value={idol.name}/>)}</datalist>{newIdolNames.length>0&&<p className="mt-2 font-normal text-orange-600">保存时将自动创建爱豆资料：{newIdolNames.join('、')}</p>}</Field></div>
    <div className="col-span-2"><Field label="关联城市"><input list="work-city-suggestions" className={control} value={form.cityText} onChange={event=>setForm({...form,cityText:event.target.value})} placeholder="输入或选择城市，多个用逗号分隔"/><datalist id="work-city-suggestions">{store.cities.map(city=><option key={city.id} value={city.name}/>)}</datalist><p className="mt-2 font-normal text-slate-400">选择关联地点后，会自动补入地点所在城市。</p></Field></div>
    <section className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start justify-between gap-6"><div><h3 className="font-bold text-slate-800">关联地点 <span className="ml-1 text-orange-600">{selectedPlaceIds.length}</span></h3><p className="mt-1 text-xs leading-5 text-slate-500">保存后会同步更新地点中的作品名称和作品 ID。</p></div>{selectedPlaceIds.length>0&&<button type="button" onClick={()=>{const previousCities=new Set(places.filter(place=>selectedPlaceIds.includes(place.id)).map(place=>place.city));setSelectedPlaceIds([]);setForm({...form,cityText:split(form.cityText).filter(city=>!previousCities.has(city)).join('，')})}} className="min-h-11 shrink-0 px-3 text-sm font-semibold text-slate-500 hover:text-red-600">清空选择</button>}</div><div className="relative mt-4"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={placeQuery} onChange={event=>setPlaceQuery(event.target.value)} className={`${control} pl-11`} placeholder="搜索地点名称、城市或地址" aria-label="搜索可关联地点"/></div>{visiblePlaces.length?<div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1">{visiblePlaces.map(place=>{const selected=selectedPlaceIds.includes(place.id);return <button type="button" key={place.id} aria-pressed={selected} onClick={()=>togglePlace(place.id)} className={`flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[.99] ${selected?'border-orange-400 bg-orange-50 shadow-sm':'border-slate-200 bg-white hover:border-slate-300'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${selected?'border-orange-500 bg-orange-500 text-white':'border-slate-300 bg-white text-transparent'}`}><Check size={16}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{place.name}</strong><span className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={13}/>{place.city} · {place.address}</span></span><span className={`shrink-0 text-xs font-semibold ${place.status==='published'?'text-emerald-700':place.status==='pending'?'text-amber-700':'text-red-700'}`}>{place.status==='published'?'已发布':place.status==='pending'?'待审核':'已驳回'}</span></button>})}</div>:<div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center"><MapPin className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm text-slate-500">{places.length?'没有匹配的地点':'还没有可关联的地点'}</p>{!places.length&&<Link to="/admin/place/new" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-orange-600">先去录入地点</Link>}</div>}</section>
   </div>
   <Submit cancel="/admin/work/list"/>
  </form>
 </AdminShell>
}
export function AdminWorkListPage(){
 const store=useBasicDataStore(),places=useAdminStore(s=>s.records),[selected,setSelected]=useState<{id:string;name:string}|null>(null)
 useEffect(()=>recalculateBasicCounts(places),[places])
 const count=(work:ManagedWork)=>places.filter(place=>place.status==='published'&&placeHasWork(place,work.id,work.name)).length
 return <AdminShell title="作品管理" subtitle="维护地点可关联的作品资料"><Toolbar add="/admin/work" label="录入作品"/><Table heads={['封面','名称','类型','年份','关联爱豆','关联地点数','操作']}>{store.works.map(x=><tr key={x.id} className="border-t border-slate-100"><td className="px-6 py-4"><ImageCell url={x.cover} name={x.name}/></td><td className="font-bold">{x.name}</td><td>{types[x.type]}</td><td>{x.year||'未填'}</td><td>{(x.relatedIdolNames?.length?x.relatedIdolNames:x.relatedIdolIds.map(id=>store.idols.find(i=>i.id===id)?.name).filter(Boolean)).join('、')||'未关联'}</td><td><CountButton value={count(x)} onClick={()=>setSelected({id:x.id,name:x.name})}/></td><td className="pr-6"><Actions edit={`/admin/work?edit=${x.id}`} remove={()=>confirm(`确定删除“${x.name}”吗？`)&&store.removeWork(x.id)}/></td></tr>)}</Table>{selected&&<RelationPlacesModal kind="work" entity={selected} places={places} onClose={()=>setSelected(null)}/>}</AdminShell>
}

export function AdminCityFormPage(){
 const store=useBasicDataStore(),[params]=useSearchParams(),edit=store.cities.find(x=>x.id===params.get('edit')),navigate=useNavigate()
 const[form,setForm]=useState(()=>({name:edit?.name||'',region:edit?.region||'',cover:edit?.cover||'',story:edit?.story||'',iconUrl:edit?.iconUrl||''}))
 const submit=(e:FormEvent)=>{e.preventDefault();const value:ManagedCity={id:edit?.id||`city-${id()}`,...form,name:form.name.trim(),region:form.region.trim(),cover:form.cover.trim(),story:form.story.trim(),iconUrl:form.iconUrl.trim(),placeCount:edit?.placeCount||0,routeCount:edit?.routeCount||0,createdAt:edit?.createdAt||now()};edit?store.updateCity(edit.id,value):store.addCity(value);navigate('/admin/city/list')}
 return <AdminShell title={edit?'编辑城市':'录入城市'} subtitle="维护城市资料与首页展示素材"><form onSubmit={submit} className="max-w-4xl rounded-2xl bg-white p-8 shadow-sm"><div className="grid grid-cols-2 gap-6"><Field label="城市名称 *"><input required className={control} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="所属省份 / 国家 *"><input required className={control} value={form.region} onChange={e=>setForm({...form,region:e.target.value})}/></Field><div className="col-span-2"><Field label="城市封面图 URL（选填）"><input className={control} value={form.cover} onChange={e=>setForm({...form,cover:e.target.value})}/></Field></div><div className="col-span-2"><Field label="城市故事 / 简介"><textarea rows={5} className={`${control} py-3`} value={form.story} onChange={e=>setForm({...form,story:e.target.value})}/></Field></div><div className="col-span-2"><Field label="地标线描图标 URL（选填）"><input className={control} value={form.iconUrl} onChange={e=>setForm({...form,iconUrl:e.target.value})}/></Field></div></div><Submit cancel="/admin/city/list"/></form></AdminShell>
}
export function AdminCityListPage(){
 const store=useBasicDataStore(),places=useAdminStore(s=>s.records),[selected,setSelected]=useState<{id:string;name:string}|null>(null)
 useEffect(()=>recalculateBasicCounts(places),[places])
 const count=(city:ManagedCity)=>places.filter(place=>place.status==='published'&&place.city===city.name).length
 return <AdminShell title="城市管理" subtitle="维护城市、封面和首页地标素材"><Toolbar add="/admin/city" label="录入城市"/><Table heads={['封面','名称','地点数','路线数','操作']}>{store.cities.map(x=><tr key={x.id} className="border-t border-slate-100"><td className="px-6 py-4"><ImageCell url={x.cover} name={x.name}/></td><td className="font-bold">{x.name}<small className="ml-2 font-normal text-slate-400">{x.region}</small></td><td><CountButton value={count(x)} onClick={()=>setSelected({id:x.id,name:x.name})}/></td><td>{x.routeCount}</td><td className="pr-6"><Actions edit={`/admin/city?edit=${x.id}`} remove={()=>confirm(`确定删除“${x.name}”吗？`)&&store.removeCity(x.id)}/></td></tr>)}</Table>{selected&&<RelationPlacesModal kind="city" entity={selected} places={places} onClose={()=>setSelected(null)}/>}</AdminShell>
}

function CountButton({value,onClick}:{value:number;onClick:()=>void}){return value>0?<button onClick={onClick} className="min-h-10 font-bold text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-800">{value}</button>:<span className="text-slate-400">0</span>}
function RelationPlacesModal({kind,entity,places,onClose}:{kind:'idol'|'work'|'city';entity:{id:string;name:string};places:AdminPlace[];onClose:()=>void}){
 const update=useAdminStore(s=>s.updateRecord)
 const rows=places.filter(place=>kind==='idol'?((place.relatedIdolIds||[]).includes(entity.id)||(place.relatedIdolNames||place.relatedIdols).includes(entity.name)):kind==='work'?placeHasWork(place,entity.id,entity.name):place.city===entity.name)
 const removeRelation=(place:AdminPlace)=>{if(!confirm(`确定移除该地点与 ${entity.name} 的关联？地点本身不会被删除`))return;if(kind==='idol'){update(place.id,{relatedIdols:place.relatedIdols.filter(name=>name!==entity.name),relatedIdolNames:(place.relatedIdolNames||place.relatedIdols).filter(name=>name!==entity.name),relatedIdolIds:(place.relatedIdolIds||[]).filter(id=>id!==entity.id)})}else if(kind==='work'){update(place.id,{relatedMovies:place.relatedMovies.filter(name=>name!==entity.name),relatedTV:place.relatedTV.filter(name=>name!==entity.name),relatedVariety:place.relatedVariety.filter(name=>name!==entity.name),relatedOtherWorks:(place.relatedOtherWorks||[]).filter(name=>name!==entity.name),relatedWorkIds:(place.relatedWorkIds||[]).filter(id=>id!==entity.id)})}setTimeout(()=>recalculateBasicCounts(useAdminStore.getState().records),0)}
 const relationNames:Record<string,string>={same_style:'同款',filming:'节目取景',public_event:'公开活动',personal_share:'个人分享',other:'其他'}
 return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><aside className="h-full w-[820px] overflow-y-auto bg-white p-8 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">关联地点详情</p><h2 className="mt-1 text-2xl font-black">{entity.name} 的关联地点（{rows.length}个）</h2></div><button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100"><X/></button></div><div className="mt-7 overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">地点名称</th><th>城市</th><th>地址</th><th>关系类型</th><th>可信度</th><th>状态</th><th className="pr-4 text-right">操作</th></tr></thead><tbody>{rows.map(place=><tr key={place.id} className="border-t"><td className="px-4 py-4 font-bold">{place.name}</td><td>{place.city}</td><td className="max-w-52 truncate pr-4">{place.address}</td><td>{relationNames[place.relationType]||place.relationType}</td><td>{place.credibility||'待审核'}</td><td>{place.status==='published'?'已发布':place.status==='rejected'?'已驳回':'待审核'}</td><td className="pr-4"><div className="flex justify-end gap-2"><Link to={`/place/${place.id}`} target="_blank" className="flex min-h-10 items-center gap-1 rounded-lg border px-3 text-xs"><ExternalLink size={14}/>查看</Link><Link to={`/admin/content?edit=${place.id}`} className="flex min-h-10 items-center gap-1 rounded-lg border px-3 text-xs"><Edit3 size={14}/>编辑</Link>{kind!=='city'&&<button onClick={()=>removeRelation(place)} className="min-h-10 rounded-lg border border-red-200 px-3 text-xs text-red-600">移除关联</button>}</div></td></tr>)}</tbody></table>{!rows.length&&<div className="py-16 text-center text-slate-400">暂无关联地点</div>}</div></aside></div>
}
function Submit({cancel}:{cancel:string}){return <div className="mt-8 flex justify-end gap-3"><Link to={cancel} className="flex min-h-12 items-center rounded-xl border border-slate-300 px-6 font-semibold">取消</Link><button className="min-h-12 rounded-xl bg-slate-950 px-8 font-bold text-white">保存</button></div>}
function Toolbar({query,setQuery,add,label}:{query?:string;setQuery?:(v:string)=>void;add:string;label:string}){return <div className="mb-6 flex justify-between rounded-2xl bg-white p-5 shadow-sm">{setQuery?<label className="flex min-h-12 w-96 items-center gap-3 rounded-xl border border-slate-300 px-4"><Search size={18}/><input className="w-full outline-none" value={query} onChange={e=>setQuery(e.target.value)} placeholder="按名称搜索"/></label>:<span/>}<Link to={add} className="flex min-h-12 items-center gap-2 rounded-xl bg-red-600 px-5 font-bold text-white"><Plus size={18}/>{label}</Link></div>}
function Table({heads,children}:{heads:string[];children:React.ReactNode}){return <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{heads.map((x,i)=><th key={x} className={`${i===0?'px-6 py-4':''} ${i===heads.length-1?'pr-6 text-right':''}`}>{x}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
