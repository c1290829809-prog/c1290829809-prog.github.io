import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import type {Credibility} from '../types'
import {trackEvent} from '../services/analytics'
import {deleteRow,upsertRow} from '../services/supabase'
interface RouteState{placeIds:string[];add:(id:string)=>void;remove:(id:string)=>void;reorder:(from:number,to:number)=>void;clear:()=>void}
export const useRouteStore=create<RouteState>()(persist((set)=>({placeIds:[],add:(id)=>{trackEvent({type:'route_add',placeId:id});set(s=>({placeIds:s.placeIds.includes(id)?s.placeIds:[...s.placeIds,id]}))},remove:(id)=>set(s=>({placeIds:s.placeIds.filter(x=>x!==id)})),reorder:(from,to)=>set(s=>{const n=[...s.placeIds];const [m]=n.splice(from,1);n.splice(to,0,m);return{placeIds:n}}),clear:()=>set({placeIds:[]})}),{name:'xunji-route'}))
interface FavoriteState{placeIds:string[];toggle:(id:string)=>void;has:(id:string)=>boolean}
export const useFavoriteStore=create<FavoriteState>()(persist((set,get)=>({placeIds:[],toggle:(id)=>{trackEvent({type:'favorite_click',placeId:id});set(s=>({placeIds:s.placeIds.includes(id)?s.placeIds.filter(x=>x!==id):[...s.placeIds,id]}))},has:(id)=>get().placeIds.includes(id)}),{name:'xunji-favorites'}))
interface FollowingState{idolIds:string[];follow:(id:string)=>void;unfollow:(id:string)=>void;has:(id:string)=>boolean}
export const useFollowingStore=create<FollowingState>()(persist((set,get)=>({
 idolIds:[],
 follow:id=>set(state=>({idolIds:state.idolIds.includes(id)?state.idolIds:[...state.idolIds,id]})),
 unfollow:id=>set(state=>({idolIds:state.idolIds.filter(idolId=>idolId!==id)})),
 has:id=>get().idolIds.includes(id)
}),{name:'xunji-followed-idols'}))
export interface AdminPlace{
 id:string;name:string;city:string;address:string;lng:number;lat:number;openTime:string;visitable:string;images:string[];
 relatedIdols:string[];relatedIdolNames?:string[];relatedIdolIds?:string[];relatedMovies:string[];relatedVariety:string[];relatedTV:string[];relatedOtherWorks?:string[];relatedWorkIds?:string[];
 relationType:string;relationDesc:string;evidence:string;credibility:Credibility|null;status:'pending'|'published'|'rejected';createdAt:string;reviewNote?:string;reviewOpinion?:string;reviewedAt?:string
 transportGuide?:string;coreSpots?:string;tips?:string
}
const reportCloudError=(error:unknown)=>{const message=error instanceof Error?error.message:'云端操作失败';console.error(message,error);if(typeof window!=='undefined')window.alert(`${message}\n数据没有保存，请稍后重试。`)}
interface AdminState{records:AdminPlace[];addRecord:(record:AdminPlace)=>Promise<boolean>;updateRecord:(id:string,changes:Partial<AdminPlace>)=>Promise<boolean>;reviewRecord:(id:string,status:'published'|'rejected',credibility:Credibility|null,reviewNote:string)=>Promise<boolean>;removeRecord:(id:string)=>Promise<boolean>;hydrateRecords:(records:AdminPlace[])=>void}
export const useAdminStore=create<AdminState>()(persist((set,get)=>({records:[],addRecord:async(record)=>{try{await upsertRow('places',record);set(s=>({records:[record,...s.records.filter(x=>x.id!==record.id)]}));return true}catch(error){reportCloudError(error);return false}},updateRecord:async(id,changes)=>{const current=get().records.find(x=>x.id===id);if(!current)return false;const updated={...current,...changes};try{await upsertRow('places',updated);set(s=>({records:s.records.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},reviewRecord:async(id,status,credibility,reviewNote)=>{const place=get().records.find(x=>x.id===id);if(!place)return false;const updated={...place,status,credibility:status==='published'?credibility:place.credibility,reviewNote,reviewOpinion:reviewNote,reviewedAt:new Date().toISOString()};try{await upsertRow('places',updated);set(s=>({records:s.records.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},removeRecord:async(id)=>{try{await deleteRow('places',id);set(s=>({records:s.records.filter(x=>x.id!==id)}));return true}catch(error){reportCloudError(error);return false}},hydrateRecords:records=>set({records})}),{
 name:'xunji-admin-places',version:4,
 migrate:(persisted:any)=>({records:(persisted?.records||[]).filter((x:any)=>!x?.place)})
}))

export interface ManagedIdol{id:string;name:string;avatar:string;roles:string[];bio:string;cities:string[];cityNames?:string[];fanName?:string;placeCount:number;createdAt:string}
export type WorkType='movie'|'tv'|'variety'|'book'|'music'|'other'
export interface ManagedWork{id:string;name:string;type:WorkType;year?:number;region?:string;cover:string;quote:string;relatedIdolIds:string[];relatedIdolNames?:string[];relatedCities:string[];cityNames?:string[];placeCount:number;createdAt:string}
export interface ManagedCity{id:string;name:string;region:string;cover:string;story:string;iconUrl:string;placeCount:number;routeCount:number;createdAt:string;autoCreated?:boolean}
interface BasicDataState{
 idols:ManagedIdol[];works:ManagedWork[];cities:ManagedCity[];
 addIdol:(value:ManagedIdol)=>Promise<boolean>;updateIdol:(id:string,value:Partial<ManagedIdol>)=>Promise<boolean>;removeIdol:(id:string)=>Promise<boolean>;
 addWork:(value:ManagedWork)=>Promise<boolean>;updateWork:(id:string,value:Partial<ManagedWork>)=>Promise<boolean>;removeWork:(id:string)=>Promise<boolean>;
 addCity:(value:ManagedCity)=>Promise<boolean>;updateCity:(id:string,value:Partial<ManagedCity>)=>Promise<boolean>;removeCity:(id:string)=>Promise<boolean>;hydrate:(data:{idols:ManagedIdol[];works:ManagedWork[];cities:ManagedCity[]})=>void
}
const createdAt=new Date().toISOString()
const seedCities:ManagedCity[]=[
 {id:'city-shenzhen',name:'深圳',region:'广东省',cover:'',story:'山海连城、开放年轻的湾区城市。',iconUrl:'',placeCount:0,routeCount:0,createdAt,autoCreated:true},
 {id:'city-shanghai',name:'上海',region:'上海市',cover:'',story:'从梧桐街区到浦江两岸，作品与城市生活在这里交汇。',iconUrl:'',placeCount:0,routeCount:0,createdAt,autoCreated:true},
 {id:'city-chongqing',name:'重庆',region:'重庆市',cover:'',story:'山城坡道、轻轨与江岸夜景构成层叠的城市镜头。',iconUrl:'',placeCount:0,routeCount:0,createdAt,autoCreated:true},
 {id:'city-beijing',name:'北京',region:'北京市',cover:'',story:'胡同、剧场、地标和现代街区共同保存着公开足迹。',iconUrl:'',placeCount:0,routeCount:0,createdAt,autoCreated:true}
]
const seedIdols:ManagedIdol[]=[
 {id:'zhou-shen',name:'周深',avatar:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',roles:['歌手'],bio:'中国内地流行乐男歌手。',cities:['city-shenzhen'],fanName:'生米',placeCount:0,createdAt},
 {id:'wang-yibo',name:'王一博',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',roles:['演员','歌手'],bio:'演员、歌手。',cities:['city-shenzhen'],placeCount:0,createdAt},
 {id:'zhao-lusi',name:'赵露思',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',roles:['演员'],bio:'中国内地女演员。',cities:['city-shenzhen'],placeCount:0,createdAt}
]
const seedWorks:ManagedWork[]=[
 {id:'work-wind',name:'风起深圳',type:'tv',year:2024,region:'中国大陆',cover:'',quote:'在城市与海风之间寻找成长答案。',relatedIdolIds:['zhao-lusi'],relatedCities:['city-shenzhen'],placeCount:0,createdAt},
 {id:'work-sea',name:'向海而生',type:'movie',year:2023,region:'中国大陆',cover:'',quote:'一段发生在深圳湾畔的青春故事。',relatedIdolIds:['wang-yibo'],relatedCities:['city-shenzhen'],placeCount:0,createdAt},
 {id:'work-stage',name:'城市舞台',type:'variety',year:2025,region:'中国大陆',cover:'',quote:'跟随音乐发现城市中的公共空间。',relatedIdolIds:['zhou-shen'],relatedCities:['city-shenzhen'],placeCount:0,createdAt}
]
function readBasicData<T>(key:string,fallback:T):T{
 if(typeof window==='undefined')return fallback
 try{
  const direct=localStorage.getItem(key)
  if(direct)return JSON.parse(direct) as T
  const legacy=localStorage.getItem('xunji-basic-data')
  if(legacy){const state=JSON.parse(legacy)?.state;const field=key==='xunji_idols'?'idols':key==='xunji_works'?'works':'cities';if(Array.isArray(state?.[field]))return state[field] as T}
 }catch{}
 return fallback
}
function normalizeIdols(value:unknown):ManagedIdol[]{
 if(!Array.isArray(value))return seedIdols
 return value.filter((item):item is Record<string,any>=>Boolean(item)&&typeof item==='object'&&typeof item.id==='string'&&typeof item.name==='string').map(item=>({
  id:item.id,name:item.name,avatar:typeof item.avatar==='string'?item.avatar:'',roles:Array.isArray(item.roles)?item.roles.filter((role:unknown)=>typeof role==='string'):[],bio:typeof item.bio==='string'?item.bio:'',cities:Array.isArray(item.cities)?item.cities.filter((city:unknown)=>typeof city==='string'):[],cityNames:Array.isArray(item.cityNames)?item.cityNames.filter((city:unknown)=>typeof city==='string'):undefined,fanName:typeof item.fanName==='string'?item.fanName:undefined,placeCount:Number.isFinite(item.placeCount)?item.placeCount:0,createdAt:typeof item.createdAt==='string'?item.createdAt:createdAt
 }))
}
function normalizeWorks(value:unknown):ManagedWork[]{
 if(!Array.isArray(value))return seedWorks
 const validTypes:WorkType[]=['movie','tv','variety','book','music','other']
 return value.filter((item):item is Record<string,any>=>Boolean(item)&&typeof item==='object'&&typeof item.id==='string'&&typeof item.name==='string').map(item=>({
  id:item.id,name:item.name,type:validTypes.includes(item.type)?item.type:'other',year:Number.isFinite(item.year)?item.year:undefined,region:typeof item.region==='string'?item.region:undefined,cover:typeof item.cover==='string'?item.cover:'',quote:typeof item.quote==='string'?item.quote:'',relatedIdolIds:Array.isArray(item.relatedIdolIds)?item.relatedIdolIds.filter((id:unknown)=>typeof id==='string'):[],relatedIdolNames:Array.isArray(item.relatedIdolNames)?item.relatedIdolNames.filter((name:unknown)=>typeof name==='string'):undefined,relatedCities:Array.isArray(item.relatedCities)?item.relatedCities.filter((id:unknown)=>typeof id==='string'):[],cityNames:Array.isArray(item.cityNames)?item.cityNames.filter((name:unknown)=>typeof name==='string'):undefined,placeCount:Number.isFinite(item.placeCount)?item.placeCount:0,createdAt:typeof item.createdAt==='string'?item.createdAt:createdAt
 }))
}
function normalizeCities(value:unknown):ManagedCity[]{
 if(!Array.isArray(value))return seedCities
 const defaultsById=new Map(seedCities.map(city=>[city.id,city]))
 const normalized=value.filter((item):item is Record<string,any>=>Boolean(item)&&typeof item==='object'&&typeof item.id==='string'&&typeof item.name==='string').map(item=>({
  id:item.id,name:item.name,region:typeof item.region==='string'?item.region:'',cover:typeof item.cover==='string'?item.cover:'',story:typeof item.story==='string'?item.story:'',iconUrl:typeof item.iconUrl==='string'?item.iconUrl:'',placeCount:Number.isFinite(item.placeCount)?item.placeCount:0,routeCount:Number.isFinite(item.routeCount)?item.routeCount:0,createdAt:typeof item.createdAt==='string'?item.createdAt:createdAt,autoCreated:typeof item.autoCreated==='boolean'?item.autoCreated:defaultsById.has(item.id)
 }))
 const names=new Set(normalized.map(city=>city.name.toLocaleLowerCase()))
 return[...normalized,...seedCities.filter(city=>!names.has(city.name.toLocaleLowerCase()))]
}
export const useBasicDataStore=create<BasicDataState>()((set,get)=>({
 idols:normalizeIdols(readBasicData('xunji_idols',seedIdols)),works:normalizeWorks(readBasicData('xunji_works',seedWorks)),cities:normalizeCities(readBasicData('xunji_cities',seedCities)),
 addIdol:async value=>{try{await upsertRow('idols',value);set(s=>({idols:[value,...s.idols.filter(x=>x.id!==value.id)]}));return true}catch(error){reportCloudError(error);return false}},updateIdol:async(id,value)=>{const current=get().idols.find(x=>x.id===id);if(!current)return false;const updated={...current,...value};try{await upsertRow('idols',updated);set(s=>({idols:s.idols.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},removeIdol:async id=>{const state=get(),works=state.works.map(work=>work.relatedIdolIds.includes(id)?{...work,relatedIdolIds:work.relatedIdolIds.filter(value=>value!==id)}:work);try{await Promise.all([deleteRow('idols',id),...works.filter((work,index)=>work!==state.works[index]).map(work=>upsertRow('works',work))]);set({idols:state.idols.filter(value=>value.id!==id),works});return true}catch(error){reportCloudError(error);return false}},
 addWork:async value=>{try{await upsertRow('works',value);set(s=>({works:[value,...s.works.filter(x=>x.id!==value.id)]}));return true}catch(error){reportCloudError(error);return false}},updateWork:async(id,value)=>{const current=get().works.find(x=>x.id===id);if(!current)return false;const updated={...current,...value};try{await upsertRow('works',updated);set(s=>({works:s.works.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},removeWork:async id=>{try{await deleteRow('works',id);set(s=>({works:s.works.filter(x=>x.id!==id)}));return true}catch(error){reportCloudError(error);return false}},
 addCity:async value=>{try{await upsertRow('cities',value);set(s=>({cities:[value,...s.cities.filter(x=>x.id!==value.id)]}));return true}catch(error){reportCloudError(error);return false}},updateCity:async(id,value)=>{const current=get().cities.find(x=>x.id===id);if(!current)return false;const updated={...current,...value};try{await upsertRow('cities',updated);set(s=>({cities:s.cities.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},removeCity:async id=>{const state=get(),idols=state.idols.map(idol=>idol.cities.includes(id)?{...idol,cities:idol.cities.filter(value=>value!==id)}:idol),works=state.works.map(work=>work.relatedCities.includes(id)?{...work,relatedCities:work.relatedCities.filter(value=>value!==id)}:work);try{await Promise.all([deleteRow('cities',id),...idols.filter((idol,index)=>idol!==state.idols[index]).map(idol=>upsertRow('idols',idol)),...works.filter((work,index)=>work!==state.works[index]).map(work=>upsertRow('works',work))]);set({cities:state.cities.filter(value=>value.id!==id),idols,works});return true}catch(error){reportCloudError(error);return false}},hydrate:data=>set(data)
}))
if(typeof window!=='undefined'){
 const save=(state:BasicDataState)=>{localStorage.setItem('xunji_idols',JSON.stringify(state.idols));localStorage.setItem('xunji_works',JSON.stringify(state.works));localStorage.setItem('xunji_cities',JSON.stringify(state.cities))}
 save(useBasicDataStore.getState())
 useBasicDataStore.subscribe(save)
}
export function recalculateBasicCounts(records:AdminPlace[]){
 const published=records.filter(place=>place.status==='published'),store=useBasicDataStore.getState()
 store.idols.forEach(idol=>{const count=published.filter(place=>(place.relatedIdolIds||[]).includes(idol.id)||(place.relatedIdolNames||place.relatedIdols).includes(idol.name)).length;if(idol.placeCount!==count)void store.updateIdol(idol.id,{placeCount:count})})
 store.works.forEach(work=>{const count=published.filter(place=>(place.relatedWorkIds||[]).includes(work.id)||[...place.relatedMovies,...place.relatedVariety,...place.relatedTV,...(place.relatedOtherWorks||[])].includes(work.name)).length;if(work.placeCount!==count)void store.updateWork(work.id,{placeCount:count})})
 store.cities.forEach(city=>{const count=published.filter(place=>place.city===city.name).length;if(city.placeCount!==count)void store.updateCity(city.id,{placeCount:count})})
}

export type FeedbackType='bug'|'suggestion'|'correction'
export type FeedbackStatus='unread'|'read'|'replied'
export interface Feedback{id:string;type:FeedbackType;content:string;contact?:string;status:FeedbackStatus;createdAt:string;reply?:string;repliedAt?:string}
interface FeedbackState{items:Feedback[];add:(value:Feedback)=>Promise<boolean>;markRead:(id:string)=>Promise<boolean>;reply:(id:string,content:string)=>Promise<boolean>;remove:(id:string)=>Promise<boolean>;hydrate:(items:Feedback[])=>void}
export const useFeedbackStore=create<FeedbackState>()(persist((set,get)=>({
 items:[],
 add:async value=>{try{await upsertRow('feedback',value);set(s=>({items:[value,...s.items.filter(x=>x.id!==value.id)]}));return true}catch(error){reportCloudError(error);return false}},
 markRead:async id=>{const current=get().items.find(x=>x.id===id);if(!current)return false;const updated={...current,status:'read' as const};try{await upsertRow('feedback',updated);set(s=>({items:s.items.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},
 reply:async(id,content)=>{const current=get().items.find(x=>x.id===id);if(!current)return false;const updated={...current,status:'replied' as const,reply:content,repliedAt:new Date().toISOString()};try{await upsertRow('feedback',updated);set(s=>({items:s.items.map(x=>x.id===id?updated:x)}));return true}catch(error){reportCloudError(error);return false}},
 remove:async id=>{try{await deleteRow('feedback',id);set(s=>({items:s.items.filter(x=>x.id!==id)}));return true}catch(error){reportCloudError(error);return false}},hydrate:items=>set({items})
}),{name:'xunji_feedback'}))
