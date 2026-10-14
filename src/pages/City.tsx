import {Heart,MapPin,Share2} from 'lucide-react'
import {Link,useNavigate,useParams} from 'react-router-dom'
import {useState} from 'react'
import {BottomNav,Card,Header} from '../components/ui'
import {places} from '../data/mock'
import {useAdminStore,useBasicDataStore,useRouteStore} from '../stores'
const cityGradients:Record<string,string>={
 深圳:'linear-gradient(135deg,#76a9d8 0%,#f4bd75 55%,#244c68 100%)',
 上海:'linear-gradient(135deg,#b9c9d8 0%,#e9b58b 48%,#635b78 100%)',
 重庆:'linear-gradient(135deg,#d98b6c 0%,#84555c 48%,#303b52 100%)',
 北京:'linear-gradient(135deg,#ddc49a 0%,#b66a55 52%,#7b3d38 100%)'
}
export function CityPage(){
 const{id:rawId=''}=useParams(),id=decodeURIComponent(rawId),cities=useBasicDataStore(s=>s.cities),city=cities.find(x=>x.id===id||x.name===id),allRecords=useAdminStore(s=>s.records),records=allRecords.filter(x=>x.status==='published'),list=records.filter(x=>x.city===city?.name),add=useRouteStore(s=>s.add),navigate=useNavigate()
 const storageKey=`xunji-city-favorite-${id}`,[favorite,setFavorite]=useState(()=>localStorage.getItem(storageKey)==='1'),[notice,setNotice]=useState('')
 if(!city)return <Header title="城市不存在" back/>
 const image=city.cover||list[0]?.images[0]||(city.name==='深圳'?places[0].images[0]:'')
 const popularPlaces=list.length?list.map(x=>({id:x.id,name:x.name,img:x.images[0]})):city.name==='深圳'?places.map(x=>({id:x.id,name:x.name,img:x.images[0]})):[]
 const showNotice=(message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),2200)}
 const share=async()=>{const data={title:`循迹 · ${city.name}`,text:`探索${city.name}的公开足迹`,url:window.location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(window.location.href);showNotice('城市链接已复制')}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))showNotice('分享未完成，请稍后重试')}}
 const toggleFavorite=()=>setFavorite(value=>{const next=!value;localStorage.setItem(storageKey,next?'1':'0');return next})
 const explore=()=>{list.forEach(place=>add(place.id));navigate(list.length>=2?'/route/builder':`/map?city=${encodeURIComponent(city.name)}`)}
 const workCount=new Set(list.flatMap(place=>[...place.relatedMovies,...place.relatedTV,...place.relatedVariety,...(place.relatedOtherWorks||[])])).size,idolCount=new Set(list.flatMap(place=>place.relatedIdolNames||place.relatedIdols)).size
 return <main className="min-h-[100dvh] bg-paper pb-28"><Header title="城市详情" back action={<div className="flex gap-2"><button type="button" aria-label="分享城市" onClick={()=>void share()} className="h-11 w-11 rounded-full bg-white"><Share2 className="mx-auto"/></button><button type="button" aria-label={favorite?'取消收藏城市':'收藏城市'} onClick={toggleFavorite} className="h-11 w-11 rounded-full bg-white"><Heart className="mx-auto" fill={favorite?'currentColor':'none'}/></button></div>}/><section className="px-5"><div className="relative h-72 overflow-hidden rounded-[28px]" style={!image?{background:cityGradients[city.name]||cityGradients.深圳}:undefined}>{image?<img src={image} alt={city.name} className="h-full w-full object-cover"/>:<div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/15">{city.name}</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/><div className="absolute bottom-6 left-6 text-white"><h1 className="text-4xl font-black">{city.name} <span className="text-yellow-300">✦</span></h1><p className="mt-2">中国 · {city.region}</p><p className="mt-4 flex items-center gap-1 text-sm"><MapPin size={16}/>关联地点 {list.length||city.placeCount||0} 个</p></div></div>
 <Card className="mt-4 p-5"><h2 className="font-black">城市故事</h2><p className="mt-3 text-lg font-bold text-orange-500">“ 一座连接海洋与未来的城市</p><p className="mt-3 text-sm leading-7 text-stone-500">{city.story||'从渔村到创新之都，这座城市有海风、落日、公园、街区，也有无数动人的故事。'}</p></Card>
 <h2 className="mb-3 mt-7 text-lg font-black">关联内容</h2><div className="grid grid-cols-2 gap-3"><Card className="p-4"><b>相关作品</b><p className="mt-2 text-2xl font-black">{workCount}</p><p className="mt-3 text-sm text-stone-400">按已发布地点统计</p></Card><Card className="p-4"><b>相关人物 / 活动</b><p className="mt-2 text-2xl font-black">{idolCount}</p><p className="mt-3 text-sm text-stone-400">按关联人物去重</p></Card></div>
 <Title text="热门地点"/>{popularPlaces.length?<div className="flex gap-3 overflow-x-auto">{popularPlaces.slice(0,4).map(x=><Link to={`/place/${x.id}`} key={x.id} className="w-36 shrink-0 rounded-[20px] bg-white p-2 shadow-soft"><div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-2xl bg-orange-100">{x.img?<img src={x.img} className="h-full w-full object-cover"/>:<MapPin className="text-orange-400"/>}</div><b className="mt-2 block truncate text-sm">{x.name}</b><p className="text-[11px] text-stone-400">查看地点详情</p></Link>)}</div>:<Card className="p-8 text-center text-sm text-stone-400">该城市暂时没有已发布地点，后台录入并审核后会自动显示。</Card>}<Title text="路线预览"/><Card className="p-4"><b>{city.name}城市漫游路线</b><p className="mt-2 text-xs text-stone-400">将加入 {list.length} 个已发布地点</p><p className="mt-3 text-sm">{list.length?list.slice(0,3).map(place=>place.name).join(' → '):'暂无可规划地点'}</p></Card><button type="button" onClick={explore} className="mt-7 min-h-14 w-full rounded-full bg-orange-500 font-black text-white">✦ {list.length>=2?`规划${city.name}路线`:`在地图探索${city.name}`}</button></section>{notice&&<div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-3 text-sm text-white">{notice}</div>}<BottomNav/></main>
}
function Title({text}:{text:string}){return <div className="mb-3 mt-7"><h2 className="text-lg font-black">{text}</h2></div>}
