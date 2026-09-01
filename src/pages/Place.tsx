import {Camera,ChevronLeft,ChevronRight,Clock,Clapperboard,Copy,MapPin,MessageCircle,Route,Share2,Star,UserRound,X} from 'lucide-react'
import {Link,useParams} from 'react-router-dom'
import {useEffect,useRef,useState} from 'react'
import {BottomNav,Card,CredibilityBadge,haptic,Header,PageAction,relationLabel} from '../components/ui'
import {getIdol,getPlace,getWork,places,relations} from '../data/mock'
import {toPublicPlace,toPublicRelation} from '../data/adminAdapters'
import {useAdminStore,useFavoriteStore,useRouteStore} from '../stores'
import {trackEvent} from '../services/analytics'
import {initMap} from '../hooks/useAMap'
export function PlacePage(){
 const{id}=useParams(),record=useAdminStore(s=>s.records.find(x=>x.id===id&&x.status==='published')),place=record?toPublicPlace(record):getPlace(id),rel=record?toPublicRelation(record):relations.find(x=>x.placeId===id),toggle=useFavoriteStore(s=>s.toggle),fav=useFavoriteStore(s=>s.placeIds.includes(id||'')),add=useRouteStore(s=>s.add)
 const[shareOpen,setShareOpen]=useState(false),[notice,setNotice]=useState('')
 useEffect(()=>{if(place)trackEvent({type:'page_view',page:'place_detail',placeId:place.id})},[place?.id])
 if(!place||!rel)return <Header title="地点不存在" back/>
 const idol=record?.relatedIdols[0]||getIdol(rel.idolId)?.name||'循迹公开活动',work=record?.relatedMovies[0]||record?.relatedTV[0]||record?.relatedVariety[0]||getWork(rel.workId)?.name
 const showNotice=(message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),2600)}
 const copyLink=async(message='地点链接已复制')=>{
  const url=window.location.href
  try{await navigator.clipboard.writeText(url)}catch{const input=document.createElement('textarea');input.value=url;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();document.execCommand('copy');input.remove()}
  setShareOpen(false);showNotice(message)
 }
 const systemShare=async()=>{
  if(navigator.share){try{await navigator.share({title:`循迹 · ${place.name}`,text:`一起去打卡 ${place.name}：${place.address}`,url:window.location.href});setShareOpen(false);showNotice('分享成功')}catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;await copyLink('分享未完成，地点链接已复制')}}
  else await copyLink('当前浏览器不支持直接分享，链接已复制')
 }
 return <main className="xj-page min-h-[100dvh] bg-paper pb-36"><Header title="地点详情" back action={<div className="flex gap-2"><button type="button" onClick={()=>{haptic();setShareOpen(true)}} aria-label="分享地点" className="xj-press flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-soft"><Share2 size={19}/></button><PageAction active={fav} onClick={()=>toggle(place.id)}/></div>}/><section className="px-5"><PlaceGallery images={place.images} name={place.name}><MiniMapPreview id={place.id} name={place.name} lng={place.lng} lat={place.lat}/></PlaceGallery>
 <Card className="-mt-5 relative z-10 p-6 pt-7"><h1 className="xj-display text-3xl font-bold">{place.name}</h1><div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--xj-text-2)]"><span>{place.city||'深圳'} · {place.address.slice(0,8)}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">可到访</span><span className="flex items-center gap-1"><Clock size={15}/>推荐停留 45分钟</span></div><p className="mt-4 text-sm leading-7 text-[var(--xj-text-body)]">{record?.relationDesc||'城市记忆与公开足迹交汇的地点，适合加入一段慢行路线。'}</p></Card>
 <Block title="关联内容"><Card className="overflow-hidden"><Row icon={<Clapperboard/>} label="关联作品" value={work||'暂无关联作品'}/><Row icon={<UserRound/>} label="关联 Idol / 活动" value={idol}/><div className="grid grid-cols-3 border-t p-4 text-center"><Info label="关系类型"><span className="rounded-lg bg-orange-50 px-2 py-1 text-xs text-orange-700">{relationLabel[rel.relationType]}</span></Info><Info label="证据来源"><span className="text-xs">公开资料<br/>媒体记录</span></Info><Info label="可信度等级"><b className="text-3xl text-orange-500">{rel.credibility}</b><CredibilityBadge level={rel.credibility}/></Info></div></Card></Block>
 <Block title="为什么值得去"><Card className="space-y-4 p-5">{['作品氛围高度贴合，可感受真实场景','位置便利，可串联附近多处地点','证据来源公开透明，适合放心加入路线'].map((x,i)=><p key={x} className="flex gap-3 text-sm leading-6"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--xj-accent-soft)] text-[var(--xj-accent)]">{[<Camera/>,<MapPin/>,<Star/>][i]}</span>{x}</p>)}</Card></Block>
 {(place.transportGuide||place.coreSpots||place.tips)&&<Block title="攻略信息"><Card className="space-y-4 p-5">{place.transportGuide&&<Guide title="怎么去" text={place.transportGuide}/>} {place.coreSpots&&<Guide title="打卡路线" text={place.coreSpots}/>} {place.tips&&<Guide title="小贴士" text={place.tips}/>}</Card></Block>}
 <Block title="附近地点推荐"><div className="flex gap-3 overflow-x-auto">{places.filter(x=>x.id!==place.id).slice(0,4).map((x,i)=><Link to={`/place/${x.id}`} key={x.id} className="w-36 shrink-0 rounded-[20px] bg-white p-2 shadow-soft"><img src={x.images[0]} className="h-20 w-full rounded-xl object-cover"/><b className="mt-2 block truncate text-sm">{x.name}</b><p className="text-[11px] text-stone-400">步行 {8+i*3} 分钟</p></Link>)}</div></Block></section>
<div className="xj-glass fixed bottom-[88px] left-1/2 z-30 grid w-[calc(100%-1rem)] -translate-x-1/2 grid-cols-[1.1fr_1fr] gap-3 rounded-[24px] border border-white/60 p-2.5 md:w-[414px] md:max-w-[calc(100%-3rem)]"><button onClick={()=>{haptic();add(place.id)}} className="xj-action xj-press flex min-h-14 items-center justify-center gap-2 rounded-[16px] font-semibold text-white"><Route/>加入路线</button><button onClick={()=>haptic()} className="xj-press min-h-14 rounded-[16px] bg-white/80 font-semibold text-[var(--xj-text-body)]">补充证据 / 纠错</button></div>{shareOpen&&<ShareSheet placeName={place.name} close={()=>setShareOpen(false)} systemShare={systemShare} wechat={()=>copyLink('链接已复制，请打开微信粘贴发送')} copy={()=>copyLink()}/>} {notice&&<div role="status" className="fixed left-1/2 top-20 z-[80] w-max max-w-[85%] -translate-x-1/2 rounded-full bg-stone-900 px-5 py-3 text-center text-sm font-medium text-white shadow-xl">{notice}</div>}<BottomNav/></main>
}
function PlaceGallery({images,name,children}:{images:string[];name:string;children:React.ReactNode}){
 const slides=images.filter(Boolean).length?images.filter(Boolean):['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=82']
 const[active,setActive]=useState(0),touchStart=useRef<number|null>(null)
 useEffect(()=>{if(slides.length<2)return;const timer=window.setInterval(()=>setActive(value=>(value+1)%slides.length),4200);return()=>window.clearInterval(timer)},[slides.length])
 const move=(step:number)=>setActive(value=>(value+step+slides.length)%slides.length)
 return <div className="relative h-[330px] overflow-hidden rounded-[30px] bg-stone-200 shadow-soft" onTouchStart={event=>{touchStart.current=event.touches[0]?.clientX??null}} onTouchEnd={event=>{const start=touchStart.current,end=event.changedTouches[0]?.clientX;touchStart.current=null;if(start!==null&&end!==undefined&&Math.abs(end-start)>36)move(end<start?1:-1)}}>
  {slides.map((src,index)=><img key={`${src}-${index}`} src={src} alt={`${name} 图片 ${index+1}`} onError={event=>{event.currentTarget.src='https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=82'}} className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${active===index?'scale-100 opacity-100':'scale-105 opacity-0'}`}/>) }
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5"/>
  {slides.length>1&&<><button type="button" aria-label="上一张图片" onClick={()=>move(-1)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-90"><ChevronLeft size={20}/></button><button type="button" aria-label="下一张图片" onClick={()=>move(1)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-90"><ChevronRight size={20}/></button><div className="absolute bottom-4 left-4 flex gap-1.5">{slides.map((_,index)=><button type="button" key={index} aria-label={`查看第 ${index+1} 张图片`} onClick={()=>setActive(index)} className={`h-1.5 rounded-full transition-all ${active===index?'w-5 bg-white':'w-1.5 bg-white/60'}`}/>)}</div><span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{active+1} / {slides.length}</span></>}
  {children}
 </div>
}
function MiniMapPreview({id,name,lng,lat}:{id:string;name:string;lng:number;lat:number}){
 const container=useRef<HTMLDivElement>(null),[failed,setFailed]=useState(false)
 const validCoordinates=Number.isFinite(lng)&&Number.isFinite(lat)&&Math.abs(lng)>0.001&&Math.abs(lat)>0.001
 useEffect(()=>{let cancelled=false,map:any
  if(!validCoordinates||!container.current){setFailed(true);return}
  setFailed(false)
  initMap(container.current,{center:[lng,lat],zoom:15,dragEnable:false,zoomEnable:false,keyboardEnable:false,doubleClickZoom:false,scrollWheel:false,jogEnable:false}).then(({AMap,map:nextMap})=>{if(cancelled){nextMap.destroy?.();return}map=nextMap;new AMap.Marker({map,position:[lng,lat],offset:new AMap.Pixel(-9,-28),content:'<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#ff6b00;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.28);transform:rotate(-45deg)"><span style="display:block;width:9px;height:9px;margin:6px;background:white;border-radius:50%"></span></div>'})}).catch(()=>{if(!cancelled)setFailed(true)})
  return()=>{cancelled=true;map?.destroy?.()}
 },[lng,lat,validCoordinates])
 return <Link to={`/map?lng=${lng}&lat=${lat}&placeId=${encodeURIComponent(id)}`} aria-label={`在地图中查看 ${name}`} className="absolute -bottom-6 right-3 h-28 w-36 overflow-hidden rounded-[22px] border-4 border-white bg-[#e9e5dc] shadow-soft transition active:scale-95">
  {validCoordinates&&!failed?<div ref={container} className="h-full w-full"/>:<FallbackMap/>}
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10"/>
  <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg"><MapPin size={20} fill="currentColor"/></span>
  <span className="absolute bottom-1.5 left-1.5 max-w-[78%] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-stone-700 shadow-sm">{validCoordinates&&!failed?'高德地图':'地图预览'} · {name}</span>
 </Link>
}
function FallbackMap(){
 return <svg aria-hidden="true" viewBox="0 0 144 112" className="h-full w-full bg-[#e8eee5]"><path d="M0 80C25 68 42 79 67 70s48-20 77-7v49H0Z" fill="#c9e4ed"/><path d="M-10 28L154 88M18-8L73 120M105-8L45 120M-8 95L154 35" fill="none" stroke="#fff" strokeWidth="8"/><path d="M-10 28L154 88M18-8L73 120M105-8L45 120M-8 95L154 35" fill="none" stroke="#d9d4c8" strokeWidth="2"/><path d="M-5 58C30 48 53 56 79 42s44-14 72-11" fill="none" stroke="#f5c36a" strokeWidth="4"/><g fill="#b8ceb2"><rect x="7" y="8" width="25" height="13" rx="3"/><rect x="108" y="76" width="28" height="16" rx="3"/><rect x="76" y="8" width="18" height="12" rx="3"/></g><g fill="#7d887a" fontSize="7"><text x="5" y="50">滨海大道</text><text x="92" y="25">城市公园</text><text x="7" y="106">深圳湾</text></g></svg>
}
function ShareSheet({placeName,close,systemShare,wechat,copy}:{placeName:string;close:()=>void;systemShare:()=>void;wechat:()=>void;copy:()=>void}){
return <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[3px]" onClick={close}><section role="dialog" aria-modal="true" aria-label={`分享 ${placeName}`} onClick={event=>event.stopPropagation()} className="xj-sheet absolute bottom-0 left-1/2 w-full max-w-xl -translate-x-1/2 rounded-t-[30px] border border-white/60 p-5 pb-8"><div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-stone-300"/><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">分享地点</h2><p className="mt-1 max-w-64 truncate text-xs text-stone-400">{placeName}</p></div><button type="button" onClick={close} aria-label="关闭分享" className="xj-press flex h-11 w-11 items-center justify-center rounded-full bg-white/70"><X size={19}/></button></div><div className="grid grid-cols-3 gap-3"><ShareOption icon={<MessageCircle/>} label="微信" color="bg-[#22a559]" click={wechat}/><ShareOption icon={<Share2/>} label="更多分享" color="bg-[var(--xj-accent)]" click={systemShare}/><ShareOption icon={<Copy/>} label="复制链接" color="bg-stone-800" click={copy}/></div><p className="mt-5 rounded-2xl bg-white/55 p-3 text-center text-[11px] leading-5 text-stone-500">手机端点击“更多分享”可调用系统分享菜单；桌面端分享微信会复制链接。</p></section></div>
}
function ShareOption({icon,label,color,click}:{icon:React.ReactNode;label:string;color:string;click:()=>void}){return <button type="button" onClick={click} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-stone-50 transition active:scale-95"><span className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${color}`}>{icon}</span><span className="text-xs font-semibold">{label}</span></button>}
function Block({title,children}:{title:string;children:React.ReactNode}){return <section className="mt-7"><h2 className="mb-3 text-lg font-black">{title}</h2>{children}</section>}
function Row({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="grid min-h-16 grid-cols-[28px_105px_1fr_20px] items-center gap-2 border-b px-4 text-sm"><span>{icon}</span><span className="text-stone-500">{label}</span><b className="truncate">{value}</b><ChevronRight size={17}/></div>}
function Info({label,children}:{label:string;children:React.ReactNode}){return <div className="flex min-h-20 flex-col items-center justify-between border-r last:border-0"><span className="text-[11px] text-stone-400">{label}</span>{children}</div>}
function Guide({title,text}:{title:string;text:string}){return <div><b>{title}</b><p className="mt-1 whitespace-pre-line text-sm leading-6 text-stone-500">{text}</p></div>}
