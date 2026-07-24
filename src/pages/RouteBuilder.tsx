import {CircleCheck,GripVertical,MoreHorizontal,Navigation,Plus,Sparkles,Trash2} from 'lucide-react'
import {useEffect,useRef,useState} from 'react'
import {BottomNav,Card,EmptyState,Header} from '../components/ui'
import {places as mocks} from '../data/mock'
import {toPublicPlace} from '../data/adminAdapters'
import {useAdminStore,useRouteStore} from '../stores'
import {trackEvent} from '../services/analytics'
import type {Place} from '../types'
export function RouteBuilderPage(){
 const ids=useRouteStore(s=>s.placeIds),add=useRouteStore(s=>s.add),remove=useRouteStore(s=>s.remove),reorder=useRouteStore(s=>s.reorder),clear=useRouteStore(s=>s.clear),records=useAdminStore(s=>s.records)
 const[drag,setDrag]=useState<number|null>(null),[duration,setDuration]=useState('半日'),[purposes,setPurposes]=useState(['作品理解']),[sort,setSort]=useState('按距离'),[showPicker,setShowPicker]=useState(ids.length===0),[generated,setGenerated]=useState(false)
 const resultRef=useRef<HTMLDivElement>(null)
 const all=Array.from(new Map([...records.filter(x=>x.status==='published').map(toPublicPlace),...mocks].map(place=>[place.id,place])).values()),list=ids.map(id=>all.find(x=>x.id===id)).filter((place):place is Place=>Boolean(place)),available=all.filter(place=>!ids.includes(place.id))
 useEffect(()=>trackEvent({type:'page_view',page:'route_builder',placeCount:list.length}),[])
 useEffect(()=>{setGenerated(false)},[ids.join('|'),duration,purposes.join('|'),sort])
 useEffect(()=>{if(generated)resultRef.current?.scrollIntoView({behavior:'smooth',block:'center'})},[generated])
 const toggle=(x:string)=>setPurposes(v=>v.includes(x)?v.filter(y=>y!==x):[...v,x])
 const generateRoute=()=>{if(list.length<2)return;setShowPicker(false);setGenerated(true);trackEvent({type:'route_generate',placeCount:list.length})}
 return <main className="min-h-[100dvh] bg-paper pb-28"><Header title="路线清单" back action={<button className="flex h-11 w-11 items-center justify-center rounded-full bg-white"><MoreHorizontal/></button>}/><section className="px-5"><div className="mb-3 flex items-end justify-between"><div><b>已选地点 · {list.length}</b><p className="mt-1 text-xs text-stone-400">长按可拖动调整顺序</p></div><button onClick={clear} disabled={!list.length} className="min-h-11 text-sm text-stone-500 disabled:opacity-35">清空全部</button></div>{!list.length?<EmptyState title="路线还是空的" body="从下方选择想去的地点，即可开始规划"/>:<Card className="overflow-hidden">{list.map((p,i)=><div key={p!.id} draggable onDragStart={()=>setDrag(i)} onDragEnd={()=>setDrag(null)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag!==null)reorder(drag,i);setDrag(null)}} className={`grid min-h-24 grid-cols-[28px_64px_1fr_46px] items-center gap-3 border-b px-3 transition last:border-0 ${drag===i?'opacity-50 shadow-xl':''}`}><GripVertical className="text-stone-300"/><img src={p!.images[0]} className="h-16 w-16 rounded-2xl object-cover"/><div><b className="text-sm">{p!.name}</b><p className="mt-1 text-[11px] text-orange-600">公开足迹 · 取景关联</p><p className="text-[11px] text-stone-400">{p!.city||'深圳'} · 城市区域</p></div><div className="text-center"><b className="text-xs">30分钟</b><span className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-full border text-xs">{i+1}</span><button onClick={()=>remove(p!.id)} aria-label={`移除 ${p!.name}`} className="mt-1 flex h-8 w-full items-center justify-center text-stone-300"><Trash2 size={14}/></button></div></div>)}</Card>}
 {showPicker&&<PlacePicker places={available} add={add}/>}
 <Block title="出行偏好"><Card className="space-y-5 p-5"><Choice label="出行时长" items={['2小时','半日','一日','多日']} selected={[duration]} click={x=>setDuration(x)}/><Choice label="路线目的" items={['拍照','散步','作品理解','公开同款']} selected={purposes} click={toggle}/><Choice label="排序方式" items={['按距离','按剧情','手动排序']} selected={[sort]} click={x=>setSort(x)}/></Card></Block>
 <Block title="路线预估"><Card className="p-5"><div className="grid grid-cols-3 divide-x text-center"><Stat label="总时长" value={list.length?`${Math.max(2,list.length)}h 30m`:'—'}/><Stat label="总地点数" value={`${list.length} 个`}/><Stat label="适合时间段" value="09:00–14:00"/></div><p className="mt-5 rounded-xl bg-orange-50 p-3 text-center text-xs text-orange-600">✦ 推荐半日慢行路线，适合深度体验与拍照</p></Card></Block>
 {generated&&<div ref={resultRef}><GeneratedRoute places={list} duration={duration} sort={sort}/></div>}
 <button disabled={list.length<2} onClick={generateRoute} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-300 to-orange-500 font-black text-white transition active:scale-[.99] disabled:opacity-40"><Sparkles/>{generated?'重新生成路线':'生成路线'}</button><button type="button" onClick={()=>setShowPicker(value=>!value)} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white font-bold shadow-soft active:scale-[.99]"><Plus className={`transition ${showPicker?'rotate-45':''}`}/>{showPicker?'收起地点选择':'继续添加地点'}</button></section><BottomNav/></main>
}
function GeneratedRoute({places,duration,sort}:{places:Place[];duration:string;sort:string}){
 const segments=places.slice(0,-1).map((place,index)=>{
  const next=places[index+1]
  const measured=distanceKm(place,next)
  const distance=measured>0.05?measured:1.2+index*.4
  return{from:place,to:next,distance,minutes:Math.max(6,Math.round(distance/4.5*60))}
 })
 const totalDistance=segments.reduce((sum,segment)=>sum+segment.distance,0)
 const travelMinutes=segments.reduce((sum,segment)=>sum+segment.minutes,0)
 const totalMinutes=travelMinutes+places.length*30
 return <section className="mt-7 overflow-hidden rounded-[26px] bg-white shadow-soft">
  <div className="flex items-start justify-between bg-gradient-to-r from-orange-50 to-amber-50 p-5"><div><p className="flex items-center gap-2 text-sm font-black text-green-700"><CircleCheck size={19}/>路线已生成</p><h2 className="mt-2 text-xl font-black">{duration} · {places.length} 个地点</h2><p className="mt-1 text-xs text-stone-500">按{sort.replace('按','')}排列，预计约 {Math.floor(totalMinutes/60)} 小时 {totalMinutes%60} 分钟</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-600">{totalDistance.toFixed(1)} km</span></div>
  <div className="border-y border-stone-100 bg-[#faf8f5] p-4"><div className="mb-3 flex items-center justify-between"><b className="text-sm">路线顺序</b><span className="text-[10px] text-stone-400">地图路线预留区域</span></div><div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="relative flex items-start justify-between gap-5" style={{minWidth:Math.max(280,places.length*82)}}><div className="absolute left-8 right-8 top-5 h-1 rounded-full bg-gradient-to-r from-orange-300 to-orange-500"/>{places.map((place,index)=><div key={place.id} className="relative z-10 w-16 shrink-0 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#faf8f5] bg-stone-900 text-sm font-black text-white shadow-md">{index+1}</span><p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4">{place.name}</p></div>)}</div></div></div>
  <div className="p-5"><h3 className="flex items-center gap-2 font-black"><Navigation size={17} className="text-orange-500"/>分段行程</h3><div className="mt-3 space-y-2">{segments.map((segment,index)=><div key={`${segment.from.id}-${segment.to.id}`} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded-2xl bg-stone-50 p-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[10px] font-black text-orange-700">{index+1}</span><p className="min-w-0 truncate text-xs"><b>{segment.from.name}</b><span className="mx-1 text-stone-300">→</span><b>{segment.to.name}</b></p><span className="text-right text-[10px] text-stone-500">{segment.distance.toFixed(1)} km<br/>约 {segment.minutes} 分钟</span></div>)}</div><p className="mt-4 rounded-xl bg-green-50 p-3 text-center text-xs font-medium text-green-700">路线生成成功，可继续调整地点或偏好后重新生成</p></div>
 </section>
}
function distanceKm(from:Place,to:Place){
 if(!Number.isFinite(from.lng)||!Number.isFinite(from.lat)||!Number.isFinite(to.lng)||!Number.isFinite(to.lat))return 0
 const radius=6371,toRadians=(value:number)=>value*Math.PI/180
 const latDelta=toRadians(to.lat-from.lat),lngDelta=toRadians(to.lng-from.lng)
 const value=Math.sin(latDelta/2)**2+Math.cos(toRadians(from.lat))*Math.cos(toRadians(to.lat))*Math.sin(lngDelta/2)**2
 return radius*2*Math.atan2(Math.sqrt(value),Math.sqrt(1-value))
}
type RoutePlace={id:string;name:string;address:string;city?:string;images:string[]}
function PlacePicker({places,add}:{places:RoutePlace[];add:(id:string)=>void}){
 return <section className="mt-5 rounded-[24px] bg-white p-4 shadow-soft">
  <div className="mb-3 flex items-center justify-between"><div><h2 className="font-black">选择地点</h2><p className="mt-1 text-[11px] text-stone-400">点击加入，可连续选择多个地点</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] text-orange-600">{places.length} 个可选</span></div>
  {places.length?<div className="max-h-80 space-y-2 overflow-y-auto pr-1">{places.map(place=><div key={place.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl bg-stone-50 p-2"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-orange-100">{place.images[0]?<img src={place.images[0]} alt="" className="h-full w-full object-cover"/>:<span className="text-xs font-bold text-orange-500">{place.name.slice(0,2)}</span>}</div><div className="min-w-0"><b className="block truncate text-sm">{place.name}</b><p className="mt-1 truncate text-[11px] text-stone-400">{place.city||'深圳'} · {place.address}</p></div><button type="button" onClick={()=>add(place.id)} aria-label={`加入 ${place.name}`} className="flex min-h-11 items-center gap-1 rounded-full bg-stone-900 px-3 text-xs font-bold text-white transition active:scale-90"><Plus size={14}/>加入</button></div>)}</div>:<p className="rounded-2xl bg-stone-50 py-8 text-center text-sm text-stone-400">所有可用地点都已加入路线</p>}
 </section>
}
function Block({title,children}:{title:string;children:React.ReactNode}){return <section className="mt-7"><h2 className="mb-3 text-lg font-black">{title}</h2>{children}</section>}
function Choice({label,items,selected,click}:{label:string;items:string[];selected:string[];click:(x:string)=>void}){return <div><b className="text-sm">{label}</b><div className="mt-2 flex gap-2 overflow-x-auto">{items.map(x=><button key={x} onClick={()=>click(x)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs ${selected.includes(x)?'bg-stone-900 text-white':'bg-stone-100'}`}>{x}</button>)}</div></div>}
function Stat({label,value}:{label:string;value:string}){return <div><p className="text-[11px] text-stone-400">{label}</p><b className="mt-2 block text-lg">{value}</b></div>}
