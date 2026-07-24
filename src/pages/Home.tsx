import {ArrowRight,Bell,BookOpen,ChevronLeft,ChevronRight,Clapperboard,Heart,MapPin,Plus,Route,Tv} from 'lucide-react'
import {Link,useNavigate} from 'react-router-dom'
import {useEffect,useRef,useState} from 'react'
import {BottomNav,CredibilityBadge,SearchBox} from '../components/ui'
import {idols as mocks,places,relations} from '../data/mock'
import {toPublicPlace,toPublicRelation} from '../data/adminAdapters'
import {useAdminStore,useBasicDataStore,useFavoriteStore,useFollowingStore,useRouteStore} from '../stores'
import {trackEvent} from '../services/analytics'
import type {Place} from '../types'
export function HomePage(){
 const nav=useNavigate(),records=useAdminStore(s=>s.records),basic=useBasicDataStore(),toggle=useFavoriteStore(s=>s.toggle),favs=useFavoriteStore(s=>s.placeIds),add=useRouteStore(s=>s.add)
 const followedIds=useFollowingStore(state=>state.idolIds)
 const published=records.filter(x=>x.status==='published')
 const featured=[...published.map(x=>({place:toPublicPlace(x),relation:toPublicRelation(x),idol:x.relatedIdols[0]||'循迹收录'})),...places.slice(0,4).map((p,i)=>({place:p,relation:relations[i],idol:mocks[i%mocks.length].name}))].slice(0,4)
 const idolSource=basic.idols.length
  ?basic.idols.map(idol=>({...idol,routeId:idol.id}))
  :[...mocks,...mocks].map((idol,index)=>({...idol,id:`${idol.id}-copy-${index}`,routeId:idol.id}))
 const idolList=idolSource.map(idol=>({...idol,hotCount:published.filter(place=>{
  const idolIds=place.relatedIdolIds??[]
  const idolNames=place.relatedIdolNames??place.relatedIdols??[]
  return idolIds.includes(idol.routeId)||idolNames.includes(idol.name)
 }).length})).sort((a,b)=>b.hotCount-a.hotCount||a.name.localeCompare(b.name,'zh-CN'))
 const latestFollowedId=followedIds[followedIds.length-1]
 const recommendedIdol=(idolList.find(idol=>idol.routeId===latestFollowedId)??idolList[0])!
 const recommendedRecords=published.filter(place=>(place.relatedIdolIds??[]).includes(recommendedIdol.routeId)||(place.relatedIdolNames??place.relatedIdols??[]).includes(recommendedIdol.name))
 const matchingMock=mocks.find(idol=>idol.id===recommendedIdol.routeId||idol.name===recommendedIdol.name)
 const mockPlaceIds=matchingMock?relations.filter(relation=>relation.idolId===matchingMock.id).map(relation=>relation.placeId):[]
 const recommendedPlaces=Array.from(new Map([...recommendedRecords.map(toPublicPlace),...places.filter(place=>mockPlaceIds.includes(place.id))].map(place=>[place.id,place])).values())
 useEffect(()=>trackEvent({type:'page_view',page:'home'}),[])
 return <main className="min-h-[100dvh] bg-paper pb-28">
  <header className="px-5 pt-8"><h1 className="text-5xl font-black tracking-[-.08em]">循迹 <span className="text-2xl text-[#f4b321]">✦ ✦</span></h1><p className="mt-2 text-sm text-stone-500">沿着喜欢的人，重演认识一座城市</p><div className="mt-5 grid grid-cols-[1fr_56px] gap-3"><SearchBox onClick={()=>nav('/search')}/><button className="flex items-center justify-center rounded-[20px] bg-white shadow-soft active:scale-95"><Bell size={21}/></button></div></header>
  <HotIdolRail idols={idolList.slice(0,12)}/>
  <Section title="今日推荐"><RecommendedPlaceCarousel idolName={recommendedIdol.name} places={recommendedPlaces}/></Section>
  <Section title="同款地点" link="全部地点"><div className="grid grid-cols-2 gap-3">{featured.map(({place,relation,idol})=><article key={place.id} className="overflow-hidden rounded-[22px] bg-white shadow-soft transition hover:-translate-y-1 active:scale-[.98]"><Link to={`/place/${place.id}`}><img src={place.images[0]} className="h-28 w-full object-cover"/><div className="p-3"><h3 className="truncate font-bold">{place.name}</h3><p className="mt-1 truncate text-[11px] text-stone-500">{place.city||'深圳'} · {place.address.slice(0,5)}</p><p className="mt-2 text-xs">{idol} <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] text-orange-700">{relation.relationType==='filming'?'取景地':'公开分享'}</span></p><p className="mt-2 truncate text-[10px] text-stone-400">#城市漫游 #公开可查</p><div className="mt-2"><CredibilityBadge level={relation.credibility}/></div></div></Link><div className="grid grid-cols-2 border-t border-stone-100 text-[11px] font-semibold"><button onClick={()=>toggle(place.id)} className="flex min-h-11 items-center justify-center gap-1 border-r active:bg-stone-50"><Heart size={14} fill={favs.includes(place.id)?'currentColor':'none'}/>收藏</button><button onClick={()=>add(place.id)} className="flex min-h-11 items-center justify-center gap-1 active:bg-stone-50"><Plus size={14}/>路线</button></div></article>)}</div></Section>
  <Section title="🔥 热门城市"><div className="grid grid-cols-2 gap-3">{['深圳','上海','重庆','北京'].map((city,i)=><Link to={`/city/${basic.cities.find(x=>x.name===city)?.id||'city-shenzhen'}`} key={city} className="relative min-h-28 overflow-hidden rounded-[20px] bg-white p-4 shadow-soft active:scale-95"><b>{city}</b><p className="mt-2 text-xs text-stone-400">{[236,152,185,273][i]} 个地点</p><p className="text-xs text-stone-400">{[18,36,14,22][i]} 条路线</p><span className="absolute bottom-2 right-3 text-4xl text-[#efb648] opacity-50">⌁</span></Link>)}</div></Section>
  <Section title="推荐路线" link="全部路线"><div className="space-y-3">{['跟着公开足迹逛深圳','练云同款上海半日路线'].map((name,i)=><Link to="/route/builder" key={name} className="grid grid-cols-[72px_1fr_20px] items-center gap-3 rounded-[20px] bg-white p-3 shadow-soft active:scale-[.99]"><img src={featured[i]?.place.images[0]} className="h-16 w-16 rounded-2xl object-cover"/><div><b className="text-sm">{name}</b><p className="mt-1 text-xs text-stone-400">05:56时 · 12个地点 · 3.2 km</p></div><ChevronRight size={18}/></Link>)}</div></Section>
  <Section title="作品入口"><div className="grid grid-cols-3 gap-3">{[
   {Icon:Clapperboard,label:'影视',types:['movie','tv']},
   {Icon:Tv,label:'综艺',types:['variety']},
   {Icon:BookOpen,label:'书籍',types:['book']}
  ].map(({Icon,label,types},i)=>{const target=basic.works.find(work=>types.includes(work.type));return <Link to={target?`/work/${target.id}`:'/works'} key={label} className="rounded-[20px] bg-white p-4 text-center shadow-soft active:scale-95"><Icon className="mx-auto" size={26}/><b className="mt-2 block text-sm">{label}</b><p className="text-[10px] text-stone-400">{[124,56,38][i]} 部作品</p></Link>})}</div></Section><BottomNav/>
 </main>
}
function RecommendedPlaceCarousel({idolName,places}:{idolName:string;places:Place[]}){
 const[current,setCurrent]=useState(0)
 useEffect(()=>{
  setCurrent(0)
  if(places.length<2)return
  const timer=window.setInterval(()=>setCurrent(index=>(index+1)%places.length),4500)
  return()=>window.clearInterval(timer)
 },[idolName,places.length])
 const active=places[current%Math.max(places.length,1)]
 if(!active)return <div className="flex h-44 flex-col items-center justify-center rounded-[26px] border border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 px-6 text-center"><MapPin className="text-orange-400"/><b className="mt-3">暂无已发布的关联地点</b><p className="mt-1 text-xs text-stone-400">地点通过审核后会出现在这里</p></div>
 const image=active.images[0]
 const previous=()=>setCurrent(index=>(index-1+places.length)%places.length)
 const next=()=>setCurrent(index=>(index+1)%places.length)
 return <article className="relative h-52 overflow-hidden rounded-[26px] bg-gradient-to-br from-amber-100 to-orange-200 shadow-soft">
  <Link to={`/place/${active.id}`} aria-label={`查看地点 ${active.name}`} className="absolute inset-0 block active:scale-[.99]">
   {image?<img key={`${active.id}-${image}`} src={image} alt={active.name} className="h-full w-full object-cover"/>:<div className="flex h-full w-full items-center justify-center text-5xl font-black text-orange-300">{active.name.slice(0,2)}</div>}
   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"/>
   <div className="absolute inset-x-0 bottom-0 p-5 pr-20 text-white" aria-live="polite">
    <p className="text-[11px] font-semibold text-white/75">{idolName} 的关联地点</p>
    <h2 className="mt-1 truncate text-2xl font-black">{active.name}</h2>
    <p className="mt-1 truncate text-xs text-white/80">{active.city||'深圳'} · {active.address}</p>
    <p className="mt-3 flex items-center gap-1 text-xs"><MapPin size={14}/>关联地点 {current+1} / {places.length}</p>
   </div>
   <span className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#ffc62d] text-black shadow-lg"><ArrowRight/></span>
  </Link>
  {places.length>1&&<>
   <button type="button" onClick={previous} aria-label="上一个关联地点" className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition active:scale-90"><ChevronLeft size={19}/></button>
   <button type="button" onClick={next} aria-label="下一个关联地点" className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition active:scale-90"><ChevronRight size={19}/></button>
   <div className="absolute right-5 top-4 z-10 flex gap-1.5">{places.map((place,index)=><button type="button" key={place.id} onClick={()=>setCurrent(index)} aria-label={`显示 ${place.name}`} className={`h-2 rounded-full transition-all ${index===current?'w-5 bg-[#ffc62d]':'w-2 bg-white/70'}`}/>)}</div>
  </>}
 </article>
}
type HotIdol={
 id:string
 routeId:string
 name:string
 avatar?:string
 hotCount:number
}
function HotIdolRail({idols}:{idols:HotIdol[]}){
 const railRef=useRef<HTMLDivElement>(null)
 const dragRef=useRef({active:false,startX:0,scrollLeft:0,moved:false})
 const followedIds=useFollowingStore(state=>state.idolIds)
 const follow=useFollowingStore(state=>state.follow)
 const [selectedId,setSelectedId]=useState(idols[0]?.id??'')
 const [dragging,setDragging]=useState(false)
 const selected=idols.find(idol=>idol.id===selectedId)??idols[0]
 useEffect(()=>{
  if(idols.length&&!idols.some(idol=>idol.id===selectedId))setSelectedId(idols[0].id)
 },[idols,selectedId])
 const scroll=(direction:-1|1)=>railRef.current?.scrollBy({left:direction*190,behavior:'smooth'})
 if(!selected)return null
 return <section className="mt-7">
  <div className="mb-3 flex items-center justify-between px-5">
   <div>
    <h2 className="text-lg font-black">热门爱豆</h2>
    <p className="mt-0.5 text-[11px] text-stone-400">左右滑动，挑选想追随的 Idol</p>
   </div>
   <div className="flex items-center gap-1">
    <button type="button" aria-label="向左浏览热门爱豆" onClick={()=>scroll(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-500 shadow-soft transition active:scale-90"><ChevronLeft size={18}/></button>
    <button type="button" aria-label="向右浏览热门爱豆" onClick={()=>scroll(1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-500 shadow-soft transition active:scale-90"><ChevronRight size={18}/></button>
   </div>
  </div>
  <div className="relative">
   <div
    ref={railRef}
    className={`flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${dragging?'cursor-grabbing select-none':'cursor-grab'}`}
    onPointerDown={event=>{
     if(event.pointerType!=='mouse'||event.button!==0)return
     dragRef.current={active:true,startX:event.clientX,scrollLeft:event.currentTarget.scrollLeft,moved:false}
     event.currentTarget.setPointerCapture(event.pointerId)
     setDragging(true)
    }}
    onPointerMove={event=>{
     if(!dragRef.current.active)return
     if(Math.abs(event.clientX-dragRef.current.startX)>4)dragRef.current.moved=true
     event.currentTarget.scrollLeft=dragRef.current.scrollLeft-(event.clientX-dragRef.current.startX)
    }}
    onPointerUp={event=>{
     dragRef.current.active=false
     if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
     setDragging(false)
    }}
    onPointerCancel={()=>{dragRef.current.active=false;setDragging(false)}}
   >
    {idols.map((idol,index)=>{
     const followed=followedIds.includes(idol.routeId)
     return <div key={idol.id} className={`relative w-[76px] shrink-0 snap-center text-center transition duration-300 ${followed?'-translate-y-1':'hover:-translate-y-0.5'}`}>
      <Link
       to={`/idol/${encodeURIComponent(idol.routeId)}`}
       aria-label={`进入 ${idol.name} 的个人主页`}
       onClick={event=>{if(dragRef.current.moved)event.preventDefault()}}
       className="block w-full transition active:scale-95"
      >
       <span className={`mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full transition duration-300 ${followed?'ring-4 ring-[#ffc62d] ring-offset-2 ring-offset-[#faf8f5] shadow-[0_0_18px_rgba(255,198,45,.4)]':'ring-2 ring-white'}`}>
        {idol.avatar?<img src={idol.avatar} alt="" className="h-full w-full rounded-full object-cover"/>:<span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-200 text-lg font-black text-orange-800">{idol.name.slice(0,2)}</span>}
       </span>
       <span className={`mt-2 block truncate text-xs font-semibold transition ${followed?'text-orange-600':'text-stone-800'}`}>{idol.name}</span>
      </Link>
      {followed
       ?<span aria-label={`已关注 ${idol.name}`} className="absolute right-0 top-12 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#ffc62d] text-[11px] font-black text-stone-900 shadow-sm">✓</span>
       :<button type="button" aria-label={`关注 ${idol.name}`} onClick={()=>{follow(idol.routeId);setSelectedId(idol.id)}} className="absolute -right-2 top-9 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#ffc62d] text-lg font-bold leading-none text-stone-900 shadow-sm">+</span></button>}
      {index<3&&<span className="sr-only">热门推荐</span>}
     </div>
    })}
   </div>
   <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[#faf8f5] to-transparent"/>
   <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[#faf8f5] to-transparent"/>
  </div>
  <div className="mx-5 mt-1 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white px-4 shadow-soft">
   <p className="min-w-0 truncate text-xs text-stone-500"><b className="text-stone-900">已选 {selected.name}</b><span className="mx-1.5 text-stone-300">·</span>{followedIds.includes(selected.routeId)?'已关注':selected.hotCount>0?`${selected.hotCount} 个公开地点`:'热门推荐'}</p>
   <Link to={`/idol/${encodeURIComponent(selected.routeId)}`} className="flex min-h-11 shrink-0 items-center gap-0.5 text-xs font-bold text-orange-600 active:scale-95">查看主页<ChevronRight size={15}/></Link>
  </div>
 </section>
}
function Section({title,link,children}:{title:string;link?:string;children:React.ReactNode}){return <section className="mt-7 px-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2>{link&&<Link to="/search" className="flex items-center text-xs text-stone-400">{link}<ChevronRight size={15}/></Link>}</div>{children}</section>}
function Tag({children}:{children:React.ReactNode}){return <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-stone-800">{children}</span>}
