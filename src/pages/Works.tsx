import {BookOpen,ChevronRight,Clapperboard,Search,Sparkles,Star} from 'lucide-react'
import {useMemo,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {BottomNav,Header} from '../components/ui'
import {useAdminStore,useBasicDataStore,type ManagedIdol,type ManagedWork} from '../stores'

type Filter='all'|'movie'|'book'|'animation'|'idol'
type HotItem={id:string;kind:'work'|'idol';name:string;image:string;typeLabel:string;placeCount:number;subtitle:string}
const typeNames:Record<string,string>={movie:'电影',tv:'电视剧',variety:'综艺',book:'小说',music:'音乐',other:'动漫'}
const categories=[{key:'movie' as const,title:'电影',Icon:Clapperboard,color:'from-[#ffb14b] to-[#f38b18]'},{key:'book' as const,title:'小说',Icon:BookOpen,color:'from-[#aa83f3] to-[#714acb]'},{key:'animation' as const,title:'动漫',Icon:Sparkles,color:'from-[#f27eb2] to-[#d94389]'},{key:'idol' as const,title:'Idol',Icon:Star,color:'from-[#ffd164] to-[#f39a08]'}]
const categoryMeta:Record<Exclude<Filter,'all'>,{title:string;empty:string}>={movie:{title:'电影',empty:'还没有录入电影作品'},book:{title:'小说',empty:'还没有录入小说作品'},animation:{title:'动漫',empty:'还没有录入动漫作品'},idol:{title:'Idol',empty:'还没有录入 Idol 资料'}}

export function WorksPage(){
 const works=useBasicDataStore(s=>s.works).filter((work):work is ManagedWork=>Boolean(work)&&typeof work.name==='string'),storedIdols=useBasicDataStore(s=>s.idols).filter(Boolean),records=useAdminStore(s=>s.records),places=records.filter(p=>p.status==='published')
 const placeIdolNames=[...new Set(places.flatMap(place=>place.relatedIdolNames||place.relatedIdols))]
 const idols:ManagedIdol[]=[...storedIdols,...placeIdolNames.filter(name=>!storedIdols.some(idol=>idol.name===name)).map(name=>({id:name,name,avatar:'',roles:[],bio:'',cities:[],placeCount:0,createdAt:''}))]
 const[query,setQuery]=useState('')
 const countWorkPlaces=(work:ManagedWork)=>places.filter(p=>(p.relatedWorkIds||[]).includes(work.id)||[...p.relatedMovies,...p.relatedTV,...p.relatedVariety,...(p.relatedOtherWorks||[])].includes(work.name)).length
 const countIdolPlaces=(idol:ManagedIdol)=>places.filter(p=>p.relatedIdols.includes(idol.name)).length
 const hot=useMemo<HotItem[]>(()=>{
  const hotWorks=works.map(w=>({id:w.id,kind:'work' as const,name:w.name,image:w.cover,typeLabel:typeNames[w.type]||'作品',placeCount:countWorkPlaces(w),subtitle:`${typeNames[w.type]||'作品'} · ${countWorkPlaces(w)} 个地点`}))
  const hotIdols=idols.map(i=>({id:i.name,kind:'idol' as const,name:i.name,image:i.avatar,typeLabel:'Idol',placeCount:countIdolPlaces(i),subtitle:`Idol · ${i.cities.length||new Set(places.filter(p=>(p.relatedIdolNames||p.relatedIdols).includes(i.name)).map(p=>p.city)).size||1} 个城市 · ${countIdolPlaces(i)} 个公开地点`}))
  return [...hotWorks,...hotIdols].filter(item=>{
   const matchQuery=item.name.toLowerCase().includes(query.trim().toLowerCase())
   return matchQuery
  }).sort((a,b)=>b.placeCount-a.placeCount).slice(0,6)
 },[works,idols,places,query])
 return <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,#ffead0_0,transparent_38%),#FAF8F5] pb-28">
  <header className="px-5 pt-9"><p className="flex items-center gap-2 text-xs font-bold text-orange-500"><span className="h-2 w-2 rounded-full bg-orange-400"/>探索与发现</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em]">作品与 Idol</h1><label className="mt-6 flex min-h-14 items-center gap-3 rounded-[20px] bg-white px-4 shadow-soft"><Search size={19} className="text-stone-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索作品或 Idol" className="w-full bg-transparent text-sm outline-none"/></label></header>
  <section className="mt-7 px-5"><h2 className="mb-4 text-sm font-black">选择类型</h2><div className="grid grid-cols-2 gap-3">{categories.map(({key,title,Icon,color})=>{const count=key==='idol'?idols.length:works.filter(work=>key==='animation'?work.type==='other':work.type===key).length;return <Link to={`/works/${key}`} key={key} className={`min-h-32 rounded-[22px] bg-gradient-to-br ${color} p-5 text-left text-white shadow-soft transition active:scale-[.97]`}><Icon size={30}/><b className="mt-3 block text-lg">{title}</b><p className="mt-1 text-xs text-white/80">{count} {key==='idol'?'位':'部'}</p></Link>})}</div></section>
  <section className="mt-8 px-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">热门内容</h2><button onClick={()=>setQuery('')} className="min-h-11 text-xs font-semibold text-orange-500">查看全部 ›</button></div><ContentRows items={hot}/></section><BottomNav/>
 </main>
}

export function WorkCategoryPage(){
 const{category}=useParams(),key=(category==='movie'||category==='book'||category==='animation'||category==='idol'?category:'movie') as Exclude<Filter,'all'>
 const works=useBasicDataStore(s=>s.works).filter((work):work is ManagedWork=>Boolean(work)&&typeof work.name==='string')
 const idols=useBasicDataStore(s=>s.idols).filter((idol):idol is ManagedIdol=>Boolean(idol)&&typeof idol.name==='string')
 const records=useAdminStore(s=>s.records),[query,setQuery]=useState('')
 const published=records.filter(place=>place.status==='published')
 const items=useMemo<HotItem[]>(()=>{
  const filteredWorks=works.filter(work=>key==='movie'?work.type==='movie':key==='book'?work.type==='book':key==='animation'?work.type==='other':false).map(work=>{const placeCount=published.filter(place=>(place.relatedWorkIds||[]).includes(work.id)||[...place.relatedMovies,...place.relatedTV,...place.relatedVariety,...(place.relatedOtherWorks||[])].includes(work.name)).length;return{id:work.id,kind:'work' as const,name:work.name,image:work.cover,typeLabel:typeNames[work.type]||'作品',placeCount,subtitle:`${typeNames[work.type]||'作品'} · ${placeCount} 个地点`}})
  const filteredIdols=key==='idol'?idols.map(idol=>{const placeCount=published.filter(place=>(place.relatedIdolIds||[]).includes(idol.id)||(place.relatedIdolNames||place.relatedIdols).includes(idol.name)).length;return{id:idol.id,kind:'idol' as const,name:idol.name,image:idol.avatar,typeLabel:'Idol',placeCount,subtitle:`Idol · ${placeCount} 个公开地点`}}):[]
  return [...filteredWorks,...filteredIdols].filter(item=>item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>b.placeCount-a.placeCount||a.name.localeCompare(b.name,'zh-CN'))
 },[key,published,works,idols,query])
 const meta=categoryMeta[key]
 return <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,#ffead0_0,transparent_38%),#FAF8F5] pb-28"><Header title={meta.title} back/><section className="px-5 pt-4"><div className="rounded-[22px] bg-white p-4 shadow-soft"><p className="text-sm font-black">全部{meta.title}</p><p className="mt-1 text-xs text-stone-400">共 {items.length} {key==='idol'?'位':'部'}，点击查看详情与关联地点</p><label className="mt-4 flex min-h-12 items-center gap-3 rounded-2xl bg-stone-50 px-4"><Search size={18} className="text-stone-400"/><input value={query} onChange={event=>setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder={`搜索${meta.title}`}/></label></div><div className="mt-5"><ContentRows items={items} empty={meta.empty}/></div></section><BottomNav/></main>
}

function ContentRows({items,empty='没有符合条件的内容'}:{items:HotItem[];empty?:string}){return <div className="space-y-3">{items.map(item=><Link to={item.kind==='work'?`/work/${item.id}`:`/idol/${item.id}`} key={`${item.kind}-${item.id}`} className="grid min-h-20 grid-cols-[52px_1fr_20px] items-center gap-3 rounded-[20px] bg-white p-3 shadow-soft transition hover:-translate-y-0.5 active:scale-[.98]">{item.image?<img src={item.image} className={`h-12 w-12 object-cover ${item.kind==='idol'?'rounded-full':'rounded-xl'}`} alt={item.name}/>:<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">{item.kind==='idol'?<Star/>:<Clapperboard/>}</span>}<div><b>{item.name}</b><p className="mt-1 text-xs text-stone-400">{item.subtitle}</p></div><ChevronRight size={18} className="text-stone-400"/></Link>)}{!items.length&&<div className="rounded-[22px] border border-dashed border-stone-300 py-14 text-center text-sm text-stone-400">{empty}</div>}</div>}
