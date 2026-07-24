import {ChevronRight,Clock,MapPin,Route} from 'lucide-react'
import {Link,useParams} from 'react-router-dom'
import {useEffect} from 'react'
import {BottomNav,Card,CredibilityBadge,Header,PageAction,relationLabel} from '../components/ui'
import {getWork,places,relations} from '../data/mock'
import {useBasicDataStore} from '../stores'
import {trackEvent} from '../services/analytics'
export function WorkPage(){
 const{id}=useParams(),basic=useBasicDataStore(),managed=basic.works.find(x=>x.id===id),mock=getWork(id)
 useEffect(()=>trackEvent({type:'page_view',page:'work_detail'}),[id])
 if(!managed&&!mock)return <Header title="作品不存在" back/>
 const work={name:managed?.name||mock!.name,type:managed?.type||mock!.type,year:managed?.year||mock!.year,region:managed?.region||'中国大陆',cover:managed?.cover||mock!.cover,quote:managed?.quote||mock!.description}
 const rels=relations.filter(x=>x.workId===id);const list=(rels.length?rels.map(r=>({p:places.find(x=>x.id===r.placeId)!,r})):relations.slice(0,4).map(r=>({p:places.find(x=>x.id===r.placeId)!,r})))
 return <main className="min-h-[100dvh] bg-paper pb-28"><Header title="作品详情" back action={<PageAction/>}/><section className="px-5"><Card className="grid grid-cols-[130px_1fr] gap-5 p-4"><img src={work.cover} className="h-48 w-32 rounded-[20px] object-cover"/><div className="py-3"><h1 className="text-2xl font-black">{work.name}</h1><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-orange-50 px-2 py-1">{work.type}</span><span>{work.year}</span><span>{work.region}</span></div><p className="mt-4 text-sm leading-6 text-stone-500">{work.quote}</p></div></Card><Card className="mt-4 grid grid-cols-3 divide-x p-4 text-center"><Stat value={String(Math.max(12,list.length))} label="关联地点数"/><Stat value="3" label="推荐路线数"/><Stat value="2.3k" label="收藏数"/></Card>
 <div className="mt-5 rounded-[22px] bg-gradient-to-r from-orange-100 to-orange-50 p-5"><b className="text-2xl text-orange-500">“</b><span className="ml-3 font-bold">作品不是终点，而是通往城市路线的入口。</span></div>
 <Block title="地点分布" link="查看全部"><button className="relative h-44 w-full overflow-hidden rounded-[22px] bg-[#e9e4db]"><div className="absolute inset-0 opacity-40" style={{backgroundImage:'linear-gradient(#c7c1b8 1px,transparent 1px),linear-gradient(90deg,#c7c1b8 1px,transparent 1px)',backgroundSize:'30px 30px'}}/>{list.map((_,i)=><MapPin key={i} className="absolute text-orange-500" style={{left:`${15+i*19}%`,top:`${25+(i%2)*35}%`}}/>)}</button></Block>
 <Block title="关联地点" link="查看全部"><Card className="overflow-hidden">{list.map(({p,r})=><Link to={`/place/${p.id}`} key={p.id} className="grid min-h-24 grid-cols-[72px_1fr_auto] items-center gap-3 border-b p-3 last:border-0"><img src={p.images[0]} className="h-16 w-16 rounded-2xl object-cover"/><div><b>{p.name}</b><p className="mt-1 text-xs text-stone-400">深圳 · 城市区域</p><div className="mt-2 flex gap-2"><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px]">{relationLabel[r.relationType]}</span><CredibilityBadge level={r.credibility}/></div></div><div className="text-xs text-stone-400"><Clock className="inline" size={14}/> 40分钟 <ChevronRight className="inline"/></div></Link>)}</Card></Block><Link to="/route/builder" className="mt-6 flex min-h-14 items-center justify-center gap-2 rounded-full bg-orange-500 font-black text-white"><Route/>生成作品路线</Link></section><BottomNav/></main>
}
function Block({title,link,children}:{title:string;link:string;children:React.ReactNode}){return <section className="mt-6"><div className="mb-3 flex justify-between"><h2 className="text-lg font-black">{title}</h2><span className="text-xs text-stone-400">{link} ›</span></div>{children}</section>}
function Stat({value,label}:{value:string;label:string}){return <div><b className="text-2xl">{value}</b><p className="text-[10px] text-stone-400">{label}</p></div>}
