export type EventType='page_view'|'favorite_click'|'route_generate'|'route_add'|'search_submit'
import {upsertRow} from './supabase'
export interface XunjiEvent{id:string;type:EventType;time:string;page?:'home'|'place_detail'|'route_builder'|'idol_detail'|'work_detail';placeId?:string;placeCount?:number;keyword?:string}
const KEY='xunji_events'
const makeId=()=>globalThis.crypto?.randomUUID?.()||`event-${Date.now()}-${Math.random().toString(36).slice(2)}`
export function getEvents():XunjiEvent[]{if(typeof window==='undefined')return[];try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.map((item,index)=>({...item,id:item.id||`legacy-${item.time||Date.now()}-${index}`})):[]}catch{return[]}}
export function replaceEvents(events:unknown){if(typeof window==='undefined'||!Array.isArray(events))return;localStorage.setItem(KEY,JSON.stringify(events.slice(-10000)));window.dispatchEvent(new CustomEvent('xunji:analytics'))}
export function trackEvent(event:Omit<XunjiEvent,'id'|'time'>){
 const events=getEvents(),now=Date.now(),last=events[events.length-1]
 if(event.type==='page_view'&&last?.type==='page_view'&&last.page===event.page&&now-new Date(last.time).getTime()<800)return
 const value:XunjiEvent={...event,id:makeId(),time:new Date(now).toISOString()}
 const next=[...events,value].slice(-5000)
 localStorage.setItem(KEY,JSON.stringify(next))
 window.dispatchEvent(new CustomEvent('xunji:analytics'))
 void upsertRow('events',value).catch(error=>console.error('统计事件写入云端失败',error))
}
