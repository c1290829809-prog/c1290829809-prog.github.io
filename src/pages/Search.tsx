import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {Header,SearchBox,EmptyState} from '../components/ui'
import {idols,places,works} from '../data/mock'
import {toPublicPlace} from '../data/adminAdapters'
import {useAdminStore} from '../stores'
import {trackEvent} from '../services/analytics'

export function SearchPage(){
 const[q,setQ]=useState('')
 const[tab,setTab]=useState<'爱豆'|'作品'|'地点'>('地点')
 const records=useAdminStore(s=>s.records)
 const published=useMemo(()=>records.filter(item=>item.status==='published').map(toPublicPlace),[records])
 const rows=useMemo(()=>{
  const source=tab==='爱豆'?idols:tab==='作品'?works:[...published,...places]
  return source.filter(item=>item.name.toLowerCase().includes(q.toLowerCase()))
 },[q,tab,published])
 return <main className="min-h-[100dvh] bg-paper"><Header title="探索" back/><section className="px-5">
  <form onSubmit={event=>{event.preventDefault();if(q.trim())trackEvent({type:'search_submit',keyword:q.trim()})}}><SearchBox value={q} onChange={setQ} autoFocus/></form>
  <div className="mt-5 flex gap-2">{(['爱豆','作品','地点'] as const).map(item=><button key={item} onClick={()=>setTab(item)} className={`min-h-11 flex-1 rounded-full text-sm ${tab===item?'bg-ink text-white':'bg-white'}`}>{item}</button>)}</div>
  {!q&&<div className="mt-7"><h2 className="font-bold">搜索历史</h2><div className="mt-3 flex gap-2"><button onClick={()=>setQ('深圳湾')} className="min-h-11 rounded-full bg-white px-4 text-sm">深圳湾</button><button onClick={()=>setQ('周深')} className="min-h-11 rounded-full bg-white px-4 text-sm">周深</button></div></div>}
  <div className="mt-6 space-y-3">{q&&rows.length===0?<EmptyState title="没有找到结果" body="换个关键词试试看。"/>:q&&rows.map((item:any)=><Link key={item.id} to={tab==='爱豆'?`/idol/${item.id}`:tab==='作品'?`/work/${item.id}`:`/place/${item.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-3"><img src={item.avatar||item.cover||item.images[0]} className="h-16 w-16 rounded-xl object-cover"/><div><h2 className="font-bold">{item.name}</h2><p className="mt-1 text-xs text-stone-500">{item.bio||item.description||item.address}</p></div></Link>)}</div>
 </section></main>
}
