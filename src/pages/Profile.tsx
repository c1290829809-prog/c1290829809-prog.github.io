import {FormEvent,useState} from 'react'
import {CheckCircle2,ChevronRight,Cloud,Heart,LogIn,LogOut,MapPin,MessageSquareText,MessageSquareWarning,Settings,Star,UserMinus} from 'lucide-react'
import {Link} from 'react-router-dom'
import {BottomNav,EmptyState,Header} from '../components/ui'
import {useAdminAuth} from '../components/AdminAuth'
import {places as mockPlaces} from '../data/mock'
import {toPublicPlace} from '../data/adminAdapters'
import {useAdminStore,useBasicDataStore,useFavoriteStore,useFollowingStore,useRouteStore} from '../stores'

export function ProfilePage(){
 const favs=useFavoriteStore(s=>s.placeIds),route=useRouteStore(s=>s.placeIds),followedIds=useFollowingStore(s=>s.idolIds),unfollow=useFollowingStore(s=>s.unfollow),managedIdols=useBasicDataStore(s=>s.idols),records=useAdminStore(s=>s.records)
 const{user,loading,signOut}=useAdminAuth()
 const followedIdols=managedIdols.filter(idol=>followedIds.includes(idol.id)),publicPlaces=[...records.filter(item=>item.status==='published').map(toPublicPlace),...mockPlaces]
 return <main className="min-h-[100dvh] bg-paper pb-24"><Header title="个人中心"/><section className="px-5">
  {loading?<div className="rounded-[24px] bg-white p-6 text-sm text-stone-500 shadow-soft">正在读取账号状态…</div>:user?<div className="rounded-[24px] bg-ink p-6 text-white shadow-soft"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Cloud size={22}/></span><div className="min-w-0"><h1 className="text-xl font-bold">已登录循迹账号</h1><p className="mt-1 truncate text-xs text-white/55">{user.email}</p></div></div><div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 p-4"><span className="flex items-center gap-2 text-xs text-white/70"><CheckCircle2 size={16}/>收藏、关注和路线已启用云端同步</span><button type="button" onClick={()=>void signOut()} className="flex min-h-11 items-center gap-1 rounded-full bg-white/10 px-4 text-xs font-semibold"><LogOut size={15}/>退出</button></div></div>:<AccountPanel/>}
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

function AccountPanel(){
 const{signInUser,signUp}=useAdminAuth()
 const[mode,setMode]=useState<'login'|'register'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(busy)return
  if(mode==='register'&&password!==confirmPassword){setError('两次输入的密码不一致');return}
  if(password.length<6){setError('密码至少需要 6 位');return}
  setBusy(true);setError('');setNotice('')
  try{
   if(mode==='login')await signInUser(email,password)
   else{const result=await signUp(email,password);if(result.needsConfirmation)setNotice('注册成功，请打开邮箱完成验证后再登录。')}
  }catch(reason){setError(reason instanceof Error?localizeAuthError(reason.message):'操作失败，请稍后重试')}finally{setBusy(false)}
 }
 return <div className="rounded-[24px] bg-white p-6 shadow-soft"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><LogIn size={22}/></span><div><h1 className="text-xl font-bold">登录后跨设备同步</h1><p className="mt-1 text-xs text-stone-500">同步收藏、关注和路线</p></div></div><div className="mt-5 grid grid-cols-2 rounded-full bg-stone-100 p-1">{(['login','register'] as const).map(value=><button type="button" key={value} onClick={()=>{setMode(value);setError('');setNotice('')}} className={`min-h-10 rounded-full text-sm font-semibold transition ${mode===value?'bg-white text-stone-900 shadow-sm':'text-stone-500'}`}>{value==='login'?'登录':'注册'}</button>)}</div><form onSubmit={submit} className="mt-5 space-y-3"><input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="邮箱" className="min-h-12 w-full rounded-2xl bg-stone-100 px-4 outline-none focus:ring-2 focus:ring-orange-200"/><input required type="password" minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder="密码（至少 6 位）" className="min-h-12 w-full rounded-2xl bg-stone-100 px-4 outline-none focus:ring-2 focus:ring-orange-200"/>{mode==='register'&&<input required type="password" minLength={6} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="再次输入密码" className="min-h-12 w-full rounded-2xl bg-stone-100 px-4 outline-none focus:ring-2 focus:ring-orange-200"/>}{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{notice}</p>}<button disabled={busy} className="min-h-12 w-full rounded-full bg-ink font-semibold text-white disabled:opacity-50">{busy?'请稍候…':mode==='login'?'登录':'创建账号'}</button></form><p className="mt-4 text-center text-[11px] leading-5 text-stone-400">普通用户账号不能进入管理后台。</p></div>
}

function localizeAuthError(message:string){
 if(message.includes('Invalid login credentials'))return'邮箱或密码不正确'
 if(message.includes('User already registered'))return'这个邮箱已经注册，请直接登录'
 if(message.includes('Email not confirmed'))return'请先打开注册邮件完成邮箱验证'
 if(message.includes('Password should be'))return'密码强度不足，请至少输入 6 位'
 return message
}
