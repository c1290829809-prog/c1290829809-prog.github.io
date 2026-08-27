import {Clapperboard,Flame,MapPin,Trash2,UserRound} from 'lucide-react'
import {useEffect,useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {EmptyState,Header,SearchBox} from '../components/ui'
import {getEvents,trackEvent} from '../services/analytics'
import {useAdminStore,useBasicDataStore} from '../stores'

type SearchType='idol'|'work'|'place'
type ResultRow={id:string;name:string;image:string;description:string;meta:string;to:string;kind:SearchType}
type SearchPlace={id:string;name:string;address:string;city:string;images:string[];status:string;relatedIdolIds:string[];relatedIdolNames:string[]}
const HISTORY_KEY='xunji_search_history'
const labels:Record<SearchType,string>={idol:'爱豆',work:'作品',place:'地点'}

export function SearchPage(){
 const[input,setInput]=useState(''),[keyword,setKeyword]=useState(''),[tab,setTab]=useState<SearchType>('idol'),[history,setHistory]=useState<string[]>(readHistory)
 const records=useAdminStore(state=>state.records),idols=useBasicDataStore(state=>state.idols),works=useBasicDataStore(state=>state.works)
 const publishedPlaces=useMemo(()=>{
  const current=records.filter(place=>place.status==='published').map(place=>({id:place.id,name:place.name,address:place.address,city:place.city,images:place.images,status:place.status,relatedIdolIds:place.relatedIdolIds||[],relatedIdolNames:place.relatedIdolNames||place.relatedIdols||[]}))
  return mergeById([...current,...readLegacyPlaces().filter(place=>place.status==='published')])
 },[records])
 useEffect(()=>{const timer=window.setTimeout(()=>setKeyword(input.trim()),300);return()=>window.clearTimeout(timer)},[input])
 const normalized=keyword.toLocaleLowerCase()
 const results=useMemo<ResultRow[]>(()=>{
  if(!normalized)return[]
  if(tab==='idol')return idols.filter(idol=>idol.name.toLocaleLowerCase().includes(normalized)).map(idol=>({id:idol.id,name:idol.name,image:idol.avatar,description:idol.bio||'资料待补充',meta:`${idol.roles.join(' · ')||'Idol'} · ${idol.placeCount||0} 个关联地点`,to:`/idol/${encodeURIComponent(idol.id)}`,kind:'idol'}))
  if(tab==='work')return works.filter(work=>work.name.toLocaleLowerCase().includes(normalized)).map(work=>({id:work.id,name:work.name,image:work.cover,description:work.quote||'暂无简介',meta:`${workTypeLabel(work.type)}${work.year?` · ${work.year}`:''} · ${work.placeCount||0} 个关联地点`,to:`/work/${encodeURIComponent(work.id)}`,kind:'work'}))
  return publishedPlaces.filter(place=>place.name.toLocaleLowerCase().includes(normalized)||place.address.toLocaleLowerCase().includes(normalized)).map(place=>({id:place.id,name:place.name,image:place.images[0]||'',description:place.address,meta:`${place.city||'城市待补充'} · 已发布`,to:`/place/${encodeURIComponent(place.id)}`,kind:'place'}))
 },[normalized,tab,idols,works,publishedPlaces])
 const hotIdols=useMemo(()=>idols.map(idol=>({...idol,effectiveCount:publishedPlaces.filter(place=>place.relatedIdolIds.includes(idol.id)||place.relatedIdolNames.includes(idol.name)).length||idol.placeCount||0})).sort((a,b)=>b.effectiveCount-a.effectiveCount).slice(0,5),[idols,publishedPlaces])
 const hotPlaces=useMemo(()=>{const views=new Map<string,number>();getEvents().forEach(event=>{if(event.type==='page_view'&&event.page==='place_detail'&&event.placeId)views.set(event.placeId,(views.get(event.placeId)||0)+1)});return[...publishedPlaces].sort((a,b)=>(views.get(b.id)||0)-(views.get(a.id)||0)||a.name.localeCompare(b.name,'zh-CN')).slice(0,5)},[publishedPlaces])
 const saveSearch=(value:string)=>{
  const term=value.trim()
  if(!term)return
  const next=[term,...history.filter(item=>item!==term)].slice(0,5)
  setHistory(next);localStorage.setItem(HISTORY_KEY,JSON.stringify(next));trackEvent({type:'search_submit',keyword:term})
 }
 const quickSearch=(value:string,nextTab?:SearchType)=>{if(nextTab)setTab(nextTab);setInput(value);setKeyword(value.trim());saveSearch(value)}
 const clearHistory=()=>{setHistory([]);localStorage.removeItem(HISTORY_KEY)}
 const searching=input.trim()!==keyword
 return <main className="min-h-[100dvh] bg-paper pb-10"><Header title="搜索" back/><section className="px-5">
  <form onSubmit={event=>{event.preventDefault();setKeyword(input.trim());saveSearch(input)}}><SearchBox value={input} onChange={setInput} autoFocus placeholder="搜索爱豆、作品、地点..."/></form>
  {history.length>0&&<section className="mt-4"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">最近搜索</h2><button type="button" onClick={clearHistory} className="flex min-h-11 items-center gap-1 text-xs text-stone-400"><Trash2 size={14}/>清空</button></div><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{history.map(item=><button type="button" key={item} onClick={()=>quickSearch(item)} className="min-h-11 shrink-0 rounded-full bg-white px-4 text-sm shadow-sm active:scale-95">{item}</button>)}</div></section>}
  <div className="mt-5 grid grid-cols-3 gap-2">{(['idol','work','place'] as const).map(item=><button type="button" key={item} onClick={()=>setTab(item)} className={`min-h-11 rounded-full text-sm font-semibold transition ${tab===item?'bg-ink text-white shadow-md':'bg-white text-stone-500'}`}>{labels[item]}</button>)}</div>
  {searching&&input.trim()&&<p className="mt-4 text-center text-xs text-stone-400">正在搜索…</p>}
  {!searching&&keyword&&<p className="mt-5 text-xs text-stone-400">在{labels[tab]}中找到 {results.length} 条结果</p>}
  <div className="mt-3 space-y-3">{!searching&&keyword&&results.map(row=><ResultCard key={`${row.kind}-${row.id}`} row={row} searched={()=>saveSearch(keyword)}/>)}</div>
  {!searching&&keyword&&results.length===0&&<div className="mt-5"><EmptyState title="没有找到结果，换个关键词试试" body={`“${keyword}”在${labels[tab]}中暂无匹配内容。`}/></div>}
  {(!keyword||(!searching&&results.length===0))&&<PopularSearch hotIdols={hotIdols} hotPlaces={hotPlaces} search={quickSearch}/>}
 </section></main>
}

function ResultCard({row,searched}:{row:ResultRow;searched:()=>void}){
 const Icon=row.kind==='idol'?UserRound:row.kind==='work'?Clapperboard:MapPin
 return <Link to={row.to} onClick={searched} className="grid grid-cols-[64px_1fr_22px] items-center gap-3 rounded-[20px] bg-white p-3 shadow-soft transition active:scale-[.99]"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-amber-200">{row.image?<img src={row.image} alt="" className="h-full w-full object-cover"/>:<Icon className="text-orange-400"/>}</div><div className="min-w-0"><h2 className="truncate font-bold">{row.name}</h2><p className="mt-1 truncate text-xs text-stone-500">{row.description}</p><p className="mt-2 text-[11px] text-orange-600">{row.meta}</p></div><span className="text-stone-300">›</span></Link>
}

function PopularSearch({hotIdols,hotPlaces,search}:{hotIdols:Array<{id:string;name:string;avatar:string;effectiveCount:number}>;hotPlaces:SearchPlace[];search:(value:string,type?:SearchType)=>void}){
 return <section className="mt-7"><h2 className="flex items-center gap-2 font-black"><Flame size={17} className="text-orange-500"/>热门搜索推荐</h2><h3 className="mt-5 text-xs font-semibold text-stone-400">热门爱豆</h3><div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{hotIdols.map(idol=><button type="button" key={idol.id} onClick={()=>search(idol.name,'idol')} className="w-20 shrink-0 rounded-2xl bg-white p-2 text-center shadow-sm active:scale-95"><span className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-xs font-bold text-orange-700">{idol.avatar?<img src={idol.avatar} alt="" className="h-full w-full object-cover"/>:idol.name.slice(0,2)}</span><b className="mt-2 block truncate text-xs">{idol.name}</b><span className="text-[9px] text-stone-400">{idol.effectiveCount} 个地点</span></button>)}</div><h3 className="mt-5 text-xs font-semibold text-stone-400">热门地点</h3><div className="mt-3 flex flex-wrap gap-2">{hotPlaces.map(place=><button type="button" key={place.id} onClick={()=>search(place.name,'place')} className="min-h-11 rounded-full bg-white px-4 text-sm shadow-sm active:scale-95">{place.name}</button>)}</div></section>
}

function readHistory():string[]{try{const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value.filter(item=>typeof item==='string').slice(0,5):[]}catch{return[]}}
function readLegacyPlaces():SearchPlace[]{try{const parsed=JSON.parse(localStorage.getItem('xunji_places')||'[]');const values=Array.isArray(parsed)?parsed:Array.isArray(parsed?.state?.records)?parsed.state.records:[];return values.filter((item:any)=>Boolean(item)&&typeof item==='object').map((item:any)=>({id:String(item.id||''),name:String(item.name||''),address:String(item.address||''),city:String(item.city||''),images:Array.isArray(item.images)?item.images.filter((image:any):image is string=>typeof image==='string'):[],status:String(item.status||'pending'),relatedIdolIds:Array.isArray(item.relatedIdolIds)?item.relatedIdolIds.filter((value:any):value is string=>typeof value==='string'):[],relatedIdolNames:Array.isArray(item.relatedIdolNames)?item.relatedIdolNames.filter((value:any):value is string=>typeof value==='string'):Array.isArray(item.relatedIdols)?item.relatedIdols.filter((value:any):value is string=>typeof value==='string'):[]})).filter((item:SearchPlace)=>item.id&&item.name)}catch{return[]}}
function mergeById<T extends{id:string}>(values:T[]):T[]{return Array.from(new Map(values.map(value=>[value.id,value])).values())}
function workTypeLabel(type:string){return({movie:'电影',tv:'电视剧',variety:'综艺',book:'书籍',music:'音乐',other:'其他'} as Record<string,string>)[type]||'作品'}
