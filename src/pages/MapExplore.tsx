import {Car,Footprints,LocateFixed,MapPin,Navigation,Plus,Search} from 'lucide-react'
import {useEffect,useMemo,useRef,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {BottomNav,CredibilityBadge,haptic} from '../components/ui'
import {initMap} from '../hooks/useAMap'
import {useAdminStore,useRouteStore,type AdminPlace} from '../stores'

type Location={lng:number;lat:number}
type Nearby=AdminPlace&{distance:number}
type MapTab='爱豆'|'作品'|'地点'
const SHENZHEN:Location={lng:114.0579,lat:22.5431}
const mapTabs:MapTab[]=['爱豆','作品','地点']
const haversine=(a:Location,b:Location)=>{const r=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180,x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return 2*r*Math.asin(Math.sqrt(x))}
const escapeHtml=(value:string)=>value.replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]||char))
const placeHasIdol=(place:AdminPlace)=>(place.relatedIdolIds?.length||place.relatedIdolNames?.length||place.relatedIdols?.length)>0
const placeHasWork=(place:AdminPlace)=>[...place.relatedMovies,...place.relatedVariety,...place.relatedTV,...(place.relatedOtherWorks||[]),...(place.relatedWorkIds||[])].length>0

export function MapExplorePage(){
 const records=useAdminStore(s=>s.records),addToRoute=useRouteStore(s=>s.add),navigate=useNavigate(),container=useRef<HTMLDivElement>(null),mapRef=useRef<any>(null)
 const[user,setUser]=useState<Location>(SHENZHEN),[notice,setNotice]=useState('正在获取你的位置…'),[selectedId,setSelectedId]=useState<string>(),[activeTab,setActiveTab]=useState<MapTab>('地点'),[query,setQuery]=useState(''),[mapError,setMapError]=useState(''),[mapAttempt,setMapAttempt]=useState(0),[sheetExpanded,setSheetExpanded]=useState(false),[sheetDrag,setSheetDrag]=useState(0)
 const dragRef=useRef<{pointerId:number;startY:number;active:boolean}>({pointerId:0,startY:0,active:false})
 const visiblePlaces=useMemo(()=>{
  const keyword=query.trim().toLowerCase()
  return records.filter(place=>place.status==='published'&&Number.isFinite(place.lng)&&Number.isFinite(place.lat)).filter(place=>{
   const searchable=[place.name,place.city,place.address,...place.relatedIdols,...(place.relatedIdolNames||[]),...place.relatedMovies,...place.relatedVariety,...place.relatedTV,...(place.relatedOtherWorks||[])].join(' ').toLowerCase()
   const matchesKeyword=!keyword||searchable.includes(keyword)
   const matchesTab=activeTab==='地点'||activeTab==='爱豆'&&placeHasIdol(place)||activeTab==='作品'&&placeHasWork(place)
   return matchesKeyword&&matchesTab
  })
 },[records,activeTab,query])
 const nearby=useMemo<Nearby[]>(()=>visiblePlaces.map(place=>({...place,distance:haversine(user,{lng:place.lng,lat:place.lat})})).sort((a,b)=>a.distance-b.distance),[visiblePlaces,user])
 const selected=nearby.find(place=>place.id===selectedId)||nearby[0]
 const walkMinutes=selected?Math.max(2,Math.round(selected.distance/4.5*60)):0
 const driveMinutes=selected?Math.max(3,Math.round(selected.distance/28*60)):0
 const focus=(place:Nearby)=>{haptic();setSelectedId(place.id);setSheetExpanded(false);mapRef.current?.setZoomAndCenter(16,[place.lng,place.lat])}
 const locate=()=>{
  if(!navigator.geolocation){setNotice('浏览器不支持定位，已显示深圳默认区域');setUser(SHENZHEN);return}
  setNotice('正在获取你的位置…')
  navigator.geolocation.getCurrentPosition(pos=>{const next={lng:pos.coords.longitude,lat:pos.coords.latitude};setUser(next);setNotice('已定位到你的位置');mapRef.current?.setZoomAndCenter(14,[next.lng,next.lat])},error=>{setUser(SHENZHEN);setNotice(error.code===error.PERMISSION_DENIED?'定位权限未开启：请在地址栏左侧的网站设置中允许位置权限。':error.code===error.TIMEOUT?'定位超时，已显示深圳默认区域；请检查网络后重试。':'当前设备无法提供定位，已显示深圳默认区域。')},{enableHighAccuracy:false,timeout:15000,maximumAge:300000})
 }
 useEffect(()=>{locate()},[])
 useEffect(()=>{let cancelled=false,map:any
  if(!container.current)return
  setMapError('')
  initMap(container.current,{center:[user.lng,user.lat],zoom:13,resizeEnable:true}).then(({AMap,map:nextMap})=>{
   if(cancelled){nextMap.destroy?.();return}
   map=nextMap;mapRef.current=map
   new AMap.Marker({map,position:[user.lng,user.lat],content:'<div style="width:18px;height:18px;border-radius:50%;background:#0071e3;border:4px solid white;box-shadow:0 0 0 6px rgba(0,113,227,.20)"></div>',offset:new AMap.Pixel(-9,-9),zIndex:180})
   const markers=visiblePlaces.map((place,index)=>{
    const marker=new AMap.Marker({map,position:[place.lng,place.lat],title:place.name,content:markerHtml(place,index+1),offset:new AMap.Pixel(-42,-86),zIndex:120})
    marker.on('click',()=>{haptic();setSelectedId(place.id);setSheetExpanded(false);map.setZoomAndCenter(16,[place.lng,place.lat])})
    return marker
   })
   if(markers.length)map.setFitView(markers,false,[50,34,50,280])
  }).catch(error=>{if(!cancelled)setMapError(error instanceof Error?error.message:'地图加载失败')})
  return()=>{cancelled=true;map?.destroy?.();if(mapRef.current===map)mapRef.current=null}
 },[visiblePlaces,user.lng,user.lat,mapAttempt])
 const retryMap=()=>{mapRef.current?.destroy?.();mapRef.current=null;setMapError('');setMapAttempt(value=>value+1)}
 const onSheetPointerDown=(event:React.PointerEvent<HTMLButtonElement>)=>{dragRef.current={pointerId:event.pointerId,startY:event.clientY,active:true};event.currentTarget.setPointerCapture(event.pointerId)}
 const onSheetPointerMove=(event:React.PointerEvent<HTMLButtonElement>)=>{if(!dragRef.current.active||dragRef.current.pointerId!==event.pointerId)return;setSheetDrag(Math.max(-68,Math.min(90,event.clientY-dragRef.current.startY)))}
 const endSheetDrag=(event:React.PointerEvent<HTMLButtonElement>)=>{if(!dragRef.current.active)return;const offset=event.clientY-dragRef.current.startY;dragRef.current.active=false;setSheetDrag(0);if(offset<-28)setSheetExpanded(true);else if(offset>28)setSheetExpanded(false);else setSheetExpanded(value=>!value);haptic()}
 const openDirections=(mode:'walk'|'car')=>{if(!selected)return;haptic();const url=`https://uri.amap.com/navigation?to=${selected.lng},${selected.lat},${encodeURIComponent(selected.name)}&mode=${mode==='walk'?'walk':'car'}&coordinate=gaode&callnative=0`;window.open(url,'_blank','noopener,noreferrer')}
 const addAndPlan=()=>{if(!selected)return;haptic();addToRoute(selected.id);navigate('/route/builder')}
 return <main className="xj-page relative h-[100dvh] overflow-hidden bg-paper">
  <div ref={container} className="absolute inset-0"/>
  {mapError&&<div className="absolute inset-0 z-10 flex items-center justify-center bg-paper p-7"><div className="max-w-sm rounded-[30px] bg-white p-6 text-center shadow-soft"><MapPin className="mx-auto mb-3 text-[var(--xj-accent)]"/><b className="block text-base">高德地图暂时未加载</b><p className="mt-2 text-xs leading-5 text-stone-500">{mapError}</p><p className="mt-2 text-xs leading-5 text-stone-400">请确认使用 Web 端（JS API）Key，并在高德控制台的安全域名中填写 localhost 与线上域名。</p><button onClick={retryMap} className="xj-press mt-5 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">重新加载高德地图</button></div></div>}
  <header className="absolute inset-x-4 top-4 z-20 flex flex-col gap-3">
   <div className="xj-glass flex min-h-14 items-center gap-3 rounded-[20px] border border-white/40 px-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"><Search size={20} strokeWidth={1.75} className="text-stone-400"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索 Idol / 作品 / 地点 / 城市" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-400"/><button type="button" onClick={()=>{haptic();navigate(-1)}} aria-label="返回" className="xj-press -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-stone-600">‹</button></div>
   <div className="flex justify-center gap-2">{mapTabs.map(tab=><button key={tab} type="button" onClick={()=>{haptic();setActiveTab(tab);setSelectedId(undefined)}} className={`xj-press min-h-10 rounded-full px-5 text-sm font-medium ${activeTab===tab?'bg-stone-900 text-white shadow-[0_8px_20px_rgba(0,0,0,.18)]':'xj-glass border border-white/40 text-stone-700 shadow-sm'}`}>{tab}</button>)}</div>
   <p className="px-3 text-center text-[11px] text-[var(--xj-text-2)]">{notice} · {visiblePlaces.length} 个地点</p>
  </header>
  <button type="button" onClick={()=>{haptic();locate()}} aria-label="定位到当前位置" className="xj-glass xj-press absolute right-5 top-[190px] z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/50 shadow-soft"><LocateFixed size={21}/></button>
  <section className={`xj-sheet absolute inset-x-0 bottom-[64px] z-30 rounded-t-[30px] ${sheetExpanded?'h-[min(62dvh,560px)]':'h-[286px]'}`} style={{transform:`translateY(${sheetDrag>0?sheetDrag:sheetDrag*.18}px)`}}>
   <button type="button" aria-label="拖动展开或收起附近地点" onPointerDown={onSheetPointerDown} onPointerMove={onSheetPointerMove} onPointerUp={endSheetDrag} onPointerCancel={endSheetDrag} className="flex min-h-12 w-full touch-none items-center justify-center"><span className="h-1.5 w-10 rounded-full bg-stone-300"/></button>
   {selected?<PlacePreview place={selected} walkMinutes={walkMinutes} driveMinutes={driveMinutes} expanded={sheetExpanded} onFocus={focus} onWalk={()=>openDirections('walk')} onDrive={()=>openDirections('car')} onPlan={addAndPlan}/>:<div className="px-5"><b>附近地点</b><p className="mt-2 text-sm text-stone-400">暂无符合条件的已发布地点</p></div>}
   {sheetExpanded&&<div className="mt-3 max-h-[calc(62dvh-238px)] overflow-y-auto px-5 pb-4"><div className="mb-3 flex items-center justify-between"><b className="text-sm">附近地点</b><span className="text-xs text-stone-400">按距离排序</span></div>{nearby.map(place=><button key={place.id} onClick={()=>focus(place)} className={`mb-2 grid min-h-20 w-full grid-cols-[56px_1fr_auto] items-center gap-3 rounded-[18px] p-2 text-left transition active:scale-[.99] ${selected?.id===place.id?'bg-[var(--xj-accent-soft)] ring-1 ring-[var(--xj-accent)]':'bg-white'}`}><PlaceImage place={place} compact/><div className="min-w-0"><b className="block truncate text-sm">{place.name}</b><p className="mt-1 truncate text-[11px] text-stone-400">{place.city} · {formatDistance(place.distance)}</p></div><CredibilityBadge level={place.credibility||'C'}/></button>)}</div>}
  </section>
  <BottomNav/>
 </main>
}

function PlacePreview({place,walkMinutes,driveMinutes,expanded,onFocus,onWalk,onDrive,onPlan}:{place:Nearby;walkMinutes:number;driveMinutes:number;expanded:boolean;onFocus:(place:Nearby)=>void;onWalk:()=>void;onDrive:()=>void;onPlan:()=>void}){
 return <div className="px-5"><div className="grid grid-cols-[88px_1fr_auto] items-center gap-3"><button type="button" onClick={()=>onFocus(place)} className="xj-press h-[88px] overflow-hidden rounded-[18px] bg-stone-100"><PlaceImage place={place}/></button><div className="min-w-0"><p className="text-[11px] font-medium text-[var(--xj-accent)]">{place.city} · {formatDistance(place.distance)}</p><h2 className="mt-1 truncate text-lg font-semibold">{place.name}</h2><p className="mt-1 truncate text-xs text-stone-400">{place.address}</p><div className="mt-2"><CredibilityBadge level={place.credibility||'C'}/></div></div><button type="button" onClick={()=>onFocus(place)} aria-label={`在地图中聚焦 ${place.name}`} className="xj-press flex h-11 w-11 items-center justify-center rounded-full bg-[var(--xj-accent-soft)] text-[var(--xj-accent)]"><Navigation size={19}/></button></div>
  <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={onWalk} className="xj-press flex min-h-12 items-center gap-3 rounded-[16px] bg-stone-50 px-4 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--xj-accent)] shadow-sm"><Footprints size={16}/></span><span><b className="block text-xs font-semibold">步行</b><span className="text-[11px] text-stone-400">约 {walkMinutes} 分钟</span></span></button><button type="button" onClick={onDrive} className="xj-press flex min-h-12 items-center gap-3 rounded-[16px] bg-stone-50 px-4 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--xj-accent)] shadow-sm"><Car size={16}/></span><span><b className="block text-xs font-semibold">驾车</b><span className="text-[11px] text-stone-400">约 {driveMinutes} 分钟</span></span></button></div>
  {!expanded&&<button type="button" onClick={onPlan} className="xj-action xj-press mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] text-sm font-semibold text-white"><Plus size={17}/>加入路线并规划</button>}
 </div>
}

function PlaceImage({place,compact=false}:{place:Nearby;compact?:boolean}){return place.images[0]?<img src={place.images[0]} alt="" className={`h-full w-full object-cover ${compact?'rounded-xl':''}`} onError={event=>{event.currentTarget.style.display='none'}}/>:<div className="flex h-full w-full items-center justify-center bg-[var(--xj-accent-soft)] text-xs font-semibold text-[var(--xj-accent)]">{place.name.slice(0,2)}</div>}
function formatDistance(distance:number){return distance<1?`${Math.max(1,Math.round(distance*1000))} m`:`${distance.toFixed(1)} km`}
function markerHtml(place:AdminPlace,index:number){const image=place.images[0]?`<img src="${escapeHtml(place.images[0])}" alt="" style="width:48px;height:48px;object-fit:cover;display:block"/>`:`<span style="display:flex;width:48px;height:48px;align-items:center;justify-content:center;background:#fce9df;color:#d97738;font-weight:700;font-size:12px">${escapeHtml(place.name.slice(0,2))}</span>`;return `<div style="width:84px;transform:translate(-50%,-100%);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','PingFang SC',sans-serif;text-align:center"><div style="position:relative;margin:auto;width:52px;height:52px;overflow:hidden;border:3px solid #fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.10),0 12px 24px rgba(0,0,0,.16)">${image}<span style="position:absolute;left:-7px;top:-7px;display:flex;width:24px;height:24px;align-items:center;justify-content:center;border:2px solid #fff;border-radius:50%;background:#d97738;color:#fff;font-size:12px;font-weight:700">${index}</span></div><span style="display:block;overflow:hidden;margin-top:5px;border-radius:999px;background:rgba(29,29,31,.90);padding:4px 7px;color:#fff;font-size:10px;font-weight:600;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.16)">${escapeHtml(place.name)}</span></div>`}
