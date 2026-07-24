import {BookOpen,ChevronRight,Clapperboard,Search,Sparkles,Star} from 'lucide-react'
import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {BottomNav} from '../components/ui'
import {useAdminStore,useBasicDataStore,type ManagedIdol,type ManagedWork} from '../stores'

type Filter='all'|'movie'|'book'|'animation'|'idol'
type HotItem={id:string;kind:'work'|'idol';name:string;image:string;typeLabel:string;placeCount:number;subtitle:string}
const typeNames:Record<string,string>={movie:'电影',tv:'电视剧',variety:'综艺',book:'小说',music:'音乐',other:'动漫'}

export function WorksPage(){
 const works=useBasicDataStore(s=>s.works),storedIdols=useBasicDataStore(s=>s.idols),records=useAdminStore(s=>s.records),places=records.filter(p=>p.status==='published')
 const placeIdolNames=[...new Set(places.flatMap(place=>place.relatedIdolNames||place.relatedIdols))]
 const idols:ManagedIdol[]=[...storedIdols,...placeIdolNames.filter(name=>!storedIdols.some(idol=>idol.name===name)).map(name=>({id:name,name,avatar:'',roles:[],bio:'',cities:[],placeCount:0,createdAt:''}))]
 const[filter,setFilter]=useState<Filter>('all'),[query,setQuery]=useState('')
 const countWorkPlaces=(work:ManagedWork)=>places.filter(p=>[...p.relatedMovies,...p.relatedTV,...p.relatedVariety,...(p.relatedOtherWorks||[])].includes(work.name)).length
 const countIdolPlaces=(idol:ManagedIdol)=>places.filter(p=>p.relatedIdols.includes(idol.name)).length
 const hot=useMemo<HotItem[]>(()=>{
  const hotWorks=works.map(w=>({id:w.id,kind:'work' as const,name:w.name,image:w.cover,typeLabel:typeNames[w.type]||'作品',placeCount:countWorkPlaces(w),subtitle:`${typeNames[w.type]||'作品'} · ${countWorkPlaces(w)} 个地点`}))
  const hotIdols=idols.map(i=>({id:i.name,kind:'idol' as const,name:i.name,image:i.avatar,typeLabel:'Idol',placeCount:countIdolPlaces(i),subtitle:`Idol · ${i.cities.length||new Set(places.filter(p=>(p.relatedIdolNames||p.relatedIdols).includes(i.name)).map(p=>p.city)).size||1} 个城市 · ${countIdolPlaces(i)} 个公开地点`}))
  return [...hotWorks,...hotIdols].filter(item=>{
   const matchQuery=item.name.toLowerCase().includes(query.trim().toLowerCase())
   const source=works.find(w=>w.id===item.id)
   const matchFilter=filter==='all'||(filter==='idol'&&item.kind==='idol')||(filter==='movie'&&source?.type==='movie')||(filter==='book'&&source?.type==='book')||(filter==='animation'&&source?.type==='other')
   return matchQuery&&matchFilter
  }).sort((a,b)=>b.placeCount-a.placeCount).slice(0,6)
 },[works,idols,places,filter,query])
 const cards=[{key:'movie' as Filter,title:'电影',count:works.filter(w=>w.type==='movie').length,Icon:Clapperboard,color:'from-[#ffb14b] to-[#f38b18]'},{key:'book' as Filter,title:'小说',count:works.filter(w=>w.type==='book').length,Icon:BookOpen,color:'from-[#aa83f3] to-[#714acb]'},{key:'animation' as Filter,title:'动漫',count:works.filter(w=>w.type==='other').length,Icon:Sparkles,color:'from-[#f27eb2] to-[#d94389]'},{key:'idol' as Filter,title:'Idol',count:idols.length,Icon:Star,color:'from-[#ffd164] to-[#f39a08]'}]
 return <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,#ffead0_0,transparent_38%),#FAF8F5] pb-28">
  <header className="px-5 pt-9"><p className="flex items-center gap-2 text-xs font-bold text-orange-500"><span className="h-2 w-2 rounded-full bg-orange-400"/>探索与发现</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em]">作品与 Idol</h1><label className="mt-6 flex min-h-14 items-center gap-3 rounded-[20px] bg-white px-4 shadow-soft"><Search size={19} className="text-stone-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索作品或 Idol" className="w-full bg-transparent text-sm outline-none"/></label></header>
  <section className="mt-7 px-5"><h2 className="mb-4 text-sm font-black">选择类型</h2><div className="grid grid-cols-2 gap-3">{cards.map(({key,title,count,Icon,color})=><button key={key} onClick={()=>setFilter(filter===key?'all':key)} className={`min-h-32 rounded-[22px] bg-gradient-to-br ${color} p-5 text-left text-white shadow-soft transition active:scale-[.97] ${filter===key?'ring-4 ring-white ring-offset-2':'opacity-95'}`}><Icon size={30}/><b className="mt-3 block text-lg">{title}</b><p className="mt-1 text-xs text-white/80">{count} {title==='Idol'?'位':'部'}</p></button>)}</div></section>
  <section className="mt-8 px-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">热门内容</h2><button onClick={()=>setFilter('all')} className="min-h-11 text-xs font-semibold text-orange-500">查看全部 ›</button></div><div className="space-y-3">{hot.map(item=><Link to={item.kind==='work'?`/work/${item.id}`:`/idol/${item.id}`} key={`${item.kind}-${item.id}`} className="grid min-h-20 grid-cols-[52px_1fr_20px] items-center gap-3 rounded-[20px] bg-white p-3 shadow-soft transition hover:-translate-y-0.5 active:scale-[.98]">{item.image?<img src={item.image} className={`h-12 w-12 object-cover ${item.kind==='idol'?'rounded-full':'rounded-xl'}`}/>:<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">{item.kind==='idol'?<Star/>:<Clapperboard/>}</span>}<div><b>{item.name}</b><p className="mt-1 text-xs text-stone-400">{item.subtitle}</p></div><ChevronRight size={18} className="text-stone-400"/></Link>)}{!hot.length&&<div className="rounded-[22px] border border-dashed border-stone-300 py-14 text-center text-sm text-stone-400">没有符合条件的内容</div>}</div></section><BottomNav/>
 </main>
}
