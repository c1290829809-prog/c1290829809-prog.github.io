import {ChevronRight,CloudOff,Heart,MapPin,MessageSquareText,MessageSquareWarning,Settings,Star,UserMinus} from 'lucide-react'
import {Link} from 'react-router-dom'
import {BottomNav,EmptyState,Header} from '../components/ui'
import {places as mockPlaces} from '../data/mock'
import {toPublicPlace} from '../data/adminAdapters'
import {useAdminStore,useBasicDataStore,useFavoriteStore,useFollowingStore,useRouteStore} from '../stores'

export function ProfilePage(){
 const favs=useFavoriteStore(s=>s.placeIds),route=useRouteStore(s=>s.placeIds),followedIds=useFollowingStore(s=>s.idolIds),unfollow=useFollowingStore(s=>s.unfollow),managedIdols=useBasicDataStore(s=>s.idols),records=useAdminStore(s=>s.records)
 const followedIdols=managedIdols.filter(idol=>followedIds.includes(idol.id)),publicPlaces=[...records.filter(item=>item.status==='published').map(toPublicPlace),...mockPlaces]
 return <main className="min-h-[100dvh] bg-paper pb-24"><Header title="个人中心"/><section className="px-5">
  <div className="rounded-[24px] bg-ink p-6 text-white shadow-soft"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><CloudOff size={22}/></span><div><h1 className="text-xl font-bold">本机访客模式</h1><p className="mt-1 text-xs text-white/55">收藏、关注和路线保存在当前浏览器</p></div></div><p className="mt-5 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-white/65">目前没有开放普通用户账号登录，因此不会再显示“模拟登录”或承诺跨设备同步。后台管理员登录与这里相互独立。</p></div>
  <Block title="我的收藏" icon={<Heart size={19}/>}><MiniPlaces ids={favs} places={publicPlaces}/></Block>
  <Block title="我的路线" icon={<MapPin size={19}/>}><p className="text-sm text-stone-500">当前路线包含 {route.length} 个地点</p><Link to="/route/builder" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent">查看路线 <ChevronRight size={16}/></Link></Block>
  <Block title="关注的爱豆" icon={<Star size={19}/>}>{followedIdols.length?<div className="flex flex-wrap gap-4">{followedIdols.map(idol=><div key={idol.id} className="w-20 rounded-2xl bg-stone-50 p-2 text-center"><Link to={`/idol/${idol.id}`} title={idol.name} className="block active:scale-95"><span className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-xs font-bold text-orange-800">{idol.avatar?<img src={idol.avatar} alt="" className="h-full w-full object-cover"/>:idol.name.slice(0,2)}</span><span className="mt-1 block truncate text-[10px] font-semibold">{idol.name}</span></Link><button type="button" onClick={()=>{if(window.confirm(`确定取消关注 ${idol.name} 吗？`))unfollow(idol.id)}} aria-label={`取消关注 ${idol.name}`} className="mt-1 flex min-h-11 w-full items-center justify-center gap-1 text-[10px] text-stone-500 active:text-red-500"><UserMinus size={13}/>取消关注</button></div>)}</div>:<EmptyState title="还没有关注" body="在首页热门爱豆中点击＋即可关注。"/>}</Block>
  <Link to="/feedback?type=correction" className="mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 shadow-soft active:scale-[.99]"><MessageSquareWarning size={20}/>投稿与纠错<ChevronRight className="ml-auto" size={18}/></Link>
  <Link to="/feedback" className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 shadow-soft active:scale-[.99]"><MessageSquareText size={20}/>意见反馈<ChevronRight className="ml-auto" size={18}/></Link>
  <Link to="/settings" className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 shadow-soft active:scale-[.99]"><Settings size={20}/>设置<ChevronRight className="ml-auto" size={18}/></Link>
 </section><BottomNav/></main>
}
function Block({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="mt-6 rounded-2xl bg-white p-5"><h2 className="mb-4 flex items-center gap-2 font-bold">{icon}{title}</h2>{children}</section>}
function MiniPlaces({ids,places}:{ids:string[];places:{id:string;name:string}[]}){const rows=ids.map(id=>places.find(place=>place.id===id)).filter((place):place is {id:string;name:string}=>Boolean(place));return rows.length?<div className="space-y-2">{rows.slice(0,5).map(place=><Link to={`/place/${place.id}`} key={place.id} className="flex min-h-11 items-center justify-between text-sm font-semibold">{place.name}<ChevronRight size={16} className="text-stone-300"/></Link>)}</div>:<EmptyState title="还没有收藏" body="喜欢的地点会出现在这里。"/>}
