import {Heart,MapPin,Share2} from 'lucide-react'
import {Link,useParams} from 'react-router-dom'
import {BottomNav,Card,Header} from '../components/ui'
import {places} from '../data/mock'
import {useAdminStore,useBasicDataStore} from '../stores'
const cityGradients:Record<string,string>={
 深圳:'linear-gradient(135deg,#76a9d8 0%,#f4bd75 55%,#244c68 100%)',
 上海:'linear-gradient(135deg,#b9c9d8 0%,#e9b58b 48%,#635b78 100%)',
 重庆:'linear-gradient(135deg,#d98b6c 0%,#84555c 48%,#303b52 100%)',
 北京:'linear-gradient(135deg,#ddc49a 0%,#b66a55 52%,#7b3d38 100%)'
}
export function CityPage(){
 const{id:rawId=''}=useParams(),id=decodeURIComponent(rawId),cities=useBasicDataStore(s=>s.cities),city=cities.find(x=>x.id===id||x.name===id),allRecords=useAdminStore(s=>s.records),records=allRecords.filter(x=>x.status==='published'),list=records.filter(x=>x.city===city?.name)
 if(!city)return <Header title="城市不存在" back/>
 const image=city.cover||list[0]?.images[0]||(city.name==='深圳'?places[0].images[0]:'')
 const popularPlaces=list.length?list.map(x=>({id:x.id,name:x.name,img:x.images[0]})):city.name==='深圳'?places.map(x=>({id:x.id,name:x.name,img:x.images[0]})):[]
 return <main className="min-h-[100dvh] bg-paper pb-28"><Header title="城市详情" back action={<div className="flex gap-2"><button className="h-11 w-11 rounded-full bg-white"><Share2 className="mx-auto"/></button><button className="h-11 w-11 rounded-full bg-white"><Heart className="mx-auto"/></button></div>}/><section className="px-5"><div className="relative h-72 overflow-hidden rounded-[28px]" style={!image?{background:cityGradients[city.name]||cityGradients.深圳}:undefined}>{image?<img src={image} alt={city.name} className="h-full w-full object-cover"/>:<div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/15">{city.name}</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/><div className="absolute bottom-6 left-6 text-white"><h1 className="text-4xl font-black">{city.name} <span className="text-yellow-300">✦</span></h1><p className="mt-2">中国 · {city.region}</p><p className="mt-4 flex items-center gap-1 text-sm"><MapPin size={16}/>关联地点 {list.length||city.placeCount||0} 个</p></div></div>
 <Card className="mt-4 p-5"><h2 className="font-black">城市故事</h2><p className="mt-3 text-lg font-bold text-orange-500">“ 一座连接海洋与未来的城市</p><p className="mt-3 text-sm leading-7 text-stone-500">{city.story||'从渔村到创新之都，这座城市有海风、落日、公园、街区，也有无数动人的故事。'}</p></Card>
 <h2 className="mb-3 mt-7 text-lg font-black">关联内容</h2><div className="grid grid-cols-2 gap-3"><Card className="p-4"><b>相关作品</b><p className="mt-2 text-2xl font-black">{Math.max(0,Math.ceil(list.length/2))}</p><p className="mt-3 text-sm text-stone-400">影视 · 综艺 · 书籍</p></Card><Card className="p-4"><b>相关人物 / 活动</b><p className="mt-2 text-2xl font-black">{list.length}</p><p className="mt-3 text-sm text-stone-400">公开活动 · 城市足迹</p></Card></div>
 <Title text="热门地点"/>{popularPlaces.length?<div className="flex gap-3 overflow-x-auto">{popularPlaces.slice(0,4).map((x,i)=><Link to={`/place/${x.id}`} key={x.id} className="w-36 shrink-0 rounded-[20px] bg-white p-2 shadow-soft"><div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-2xl bg-orange-100">{x.img?<img src={x.img} className="h-full w-full object-cover"/>:<MapPin className="text-orange-400"/>}</div><b className="mt-2 block truncate text-sm">{x.name}</b><p className="text-[11px] text-stone-400">步行 {8+i*2} 分钟</p></Link>)}</div>:<Card className="p-8 text-center text-sm text-stone-400">该城市暂时没有已发布地点，后台录入并审核后会自动显示。</Card>}<Title text="推荐路线"/><Card className="p-4"><b>{city.name}城市漫游路线</b><p className="mt-2 text-xs text-stone-400">{city.routeCount||0} 条路线待探索</p><p className="mt-3 text-sm">{list.length?list.slice(0,3).map(place=>place.name).join(' → '):'城市中心 → 代表街区 → 地标空间'}</p></Card><button className="mt-7 min-h-14 w-full rounded-full bg-orange-500 font-black text-white">✦ 开始探索{city.name}</button></section><BottomNav/></main>
}
function Title({text}:{text:string}){return <div className="mb-3 mt-7 flex justify-between"><h2 className="text-lg font-black">{text}</h2><span className="text-xs text-stone-400">全部 ›</span></div>}
