import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import type {Credibility} from '../types'
import {trackEvent} from '../services/analytics'
interface RouteState{placeIds:string[];add:(id:string)=>void;remove:(id:string)=>void;reorder:(from:number,to:number)=>void;clear:()=>void}
export const useRouteStore=create<RouteState>()(persist((set)=>({placeIds:[],add:(id)=>{trackEvent({type:'route_add',placeId:id});set(s=>({placeIds:s.placeIds.includes(id)?s.placeIds:[...s.placeIds,id]}))},remove:(id)=>set(s=>({placeIds:s.placeIds.filter(x=>x!==id)})),reorder:(from,to)=>set(s=>{const n=[...s.placeIds];const [m]=n.splice(from,1);n.splice(to,0,m);return{placeIds:n}}),clear:()=>set({placeIds:[]})}),{name:'xunji-route'}))
interface FavoriteState{placeIds:string[];toggle:(id:string)=>void;has:(id:string)=>boolean}
export const useFavoriteStore=create<FavoriteState>()(persist((set,get)=>({placeIds:[],toggle:(id)=>{trackEvent({type:'favorite_click',placeId:id});set(s=>({placeIds:s.placeIds.includes(id)?s.placeIds.filter(x=>x!==id):[...s.placeIds,id]}))},has:(id)=>get().placeIds.includes(id)}),{name:'xunji-favorites'}))
export interface AdminPlace{
 id:string;name:string;city:string;address:string;lng:number;lat:number;openTime:string;visitable:string;images:string[];
 relatedIdols:string[];relatedIdolNames?:string[];relatedIdolIds?:string[];relatedMovies:string[];relatedVariety:string[];relatedTV:string[];relatedOtherWorks?:string[];
 relationType:string;relationDesc:string;evidence:string;credibility:Credibility|null;status:'pending'|'published'|'rejected';createdAt:string;reviewNote?:string;reviewOpinion?:string;reviewedAt?:string
 transportGuide?:string;coreSpots?:string;tips?:string
}
interface AdminState{records:AdminPlace[];addRecord:(record:AdminPlace)=>void;updateRecord:(id:string,changes:Partial<AdminPlace>)=>void;reviewRecord:(id:string,status:'published'|'rejected',credibility:Credibility|null,reviewNote:string)=>void;removeRecord:(id:string)=>void}
export const useAdminStore=create<AdminState>()(persist((set)=>({records:[],addRecord:(record)=>set(s=>({records:[record,...s.records]})),updateRecord:(id,changes)=>set(s=>({records:s.records.map(x=>x.id===id?{...x,...changes}:x)})),reviewRecord:(id,status,credibility,reviewNote)=>set(s=>({records:s.records.map(place=>{if(place.id!==id)return place;const updated={...place};updated.status=status;updated.credibility=status==='published'?credibility:place.credibility;updated.reviewNote=reviewNote;updated.reviewOpinion=reviewNote;updated.reviewedAt=new Date().toISOString();return updated})})),removeRecord:(id)=>set(s=>({records:s.records.filter(x=>x.id!==id)}))}),{
 name:'xunji-admin-places',version:4,
 migrate:(persisted:any)=>({records:(persisted?.records||[]).filter((x:any)=>!x?.place)})
}))

export interface ManagedIdol{id:string;name:string;avatar:string;roles:string[];bio:string;cities:string[];cityNames?:string[];fanName?:string;placeCount:number;createdAt:string}
export type WorkType='movie'|'tv'|'variety'|'book'|'music'|'other'
export interface ManagedWork{id:string;name:string;type:WorkType;year?:number;region?:string;cover:string;quote:string;relatedIdolIds:string[];relatedCities:string[];placeCount:number;createdAt:string}
export interface ManagedCity{id:string;name:string;region:string;cover:string;story:string;iconUrl:string;placeCount:number;routeCount:number;createdAt:string}
interface BasicDataState{
 idols:ManagedIdol[];works:ManagedWork[];cities:ManagedCity[];
 addIdol:(value:ManagedIdol)=>void;updateIdol:(id:string,value:Partial<ManagedIdol>)=>void;removeIdol:(id:string)=>void;
 addWork:(value:ManagedWork)=>void;updateWork:(id:string,value:Partial<ManagedWork>)=>void;removeWork:(id:string)=>void;
 addCity:(value:ManagedCity)=>void;updateCity:(id:string,value:Partial<ManagedCity>)=>void;removeCity:(id:string)=>void
}
const createdAt=new Date().toISOString()
const seedCities:ManagedCity[]=[{id:'city-shenzhen',name:'深圳',region:'广东省',cover:'',story:'山海连城、开放年轻的湾区城市。',iconUrl:'',placeCount:0,routeCount:0,createdAt}]
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
export const useBasicDataStore=create<BasicDataState>()((set)=>({
 idols:readBasicData('xunji_idols',seedIdols),works:readBasicData('xunji_works',seedWorks),cities:readBasicData('xunji_cities',seedCities),
 addIdol:value=>set(s=>({idols:[value,...s.idols]})),updateIdol:(id,value)=>set(s=>({idols:s.idols.map(x=>x.id===id?{...x,...value}:x)})),removeIdol:id=>set(s=>({idols:s.idols.filter(x=>x.id!==id),works:s.works.map(w=>({...w,relatedIdolIds:w.relatedIdolIds.filter(x=>x!==id)}))})),
 addWork:value=>set(s=>({works:[value,...s.works]})),updateWork:(id,value)=>set(s=>({works:s.works.map(x=>x.id===id?{...x,...value}:x)})),removeWork:id=>set(s=>({works:s.works.filter(x=>x.id!==id)})),
 addCity:value=>set(s=>({cities:[value,...s.cities]})),updateCity:(id,value)=>set(s=>({cities:s.cities.map(x=>x.id===id?{...x,...value}:x)})),removeCity:id=>set(s=>({cities:s.cities.filter(x=>x.id!==id),idols:s.idols.map(i=>({...i,cities:i.cities.filter(x=>x!==id)})),works:s.works.map(w=>({...w,relatedCities:w.relatedCities.filter(x=>x!==id)}))}))
}))
if(typeof window!=='undefined'){
 const save=(state:BasicDataState)=>{localStorage.setItem('xunji_idols',JSON.stringify(state.idols));localStorage.setItem('xunji_works',JSON.stringify(state.works));localStorage.setItem('xunji_cities',JSON.stringify(state.cities))}
 save(useBasicDataStore.getState())
 useBasicDataStore.subscribe(save)
}
export function recalculateBasicCounts(records:AdminPlace[]){
 const published=records.filter(place=>place.status==='published'),store=useBasicDataStore.getState()
 store.idols.forEach(idol=>{const count=published.filter(place=>(place.relatedIdolIds||[]).includes(idol.id)||(place.relatedIdolNames||place.relatedIdols).includes(idol.name)).length;if(idol.placeCount!==count)store.updateIdol(idol.id,{placeCount:count})})
 store.works.forEach(work=>{const count=published.filter(place=>[...place.relatedMovies,...place.relatedVariety,...place.relatedTV,...(place.relatedOtherWorks||[])].includes(work.name)).length;if(work.placeCount!==count)store.updateWork(work.id,{placeCount:count})})
 store.cities.forEach(city=>{const count=published.filter(place=>place.city===city.name).length;if(city.placeCount!==count)store.updateCity(city.id,{placeCount:count})})
}

export type FeedbackType='bug'|'suggestion'|'correction'
export type FeedbackStatus='unread'|'read'|'replied'
export interface Feedback{id:string;type:FeedbackType;content:string;contact?:string;status:FeedbackStatus;createdAt:string;reply?:string;repliedAt?:string}
interface FeedbackState{items:Feedback[];add:(value:Feedback)=>void;markRead:(id:string)=>void;reply:(id:string,content:string)=>void;remove:(id:string)=>void}
export const useFeedbackStore=create<FeedbackState>()(persist((set)=>({
 items:[],
 add:value=>set(s=>({items:[value,...s.items]})),
 markRead:id=>set(s=>({items:s.items.map(x=>x.id===id&&x.status==='unread'?{...x,status:'read'}:x)})),
 reply:(id,content)=>set(s=>({items:s.items.map(x=>x.id===id?{...x,status:'replied',reply:content,repliedAt:new Date().toISOString()}:x)})),
 remove:id=>set(s=>({items:s.items.filter(x=>x.id!==id)}))
}),{name:'xunji_feedback'}))
