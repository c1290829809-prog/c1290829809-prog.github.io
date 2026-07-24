export type EventType='page_view'|'favorite_click'|'route_generate'|'route_add'|'search_submit'
export interface XunjiEvent{type:EventType;time:string;page?:'home'|'place_detail'|'route_builder'|'idol_detail'|'work_detail';placeId?:string;placeCount?:number;keyword?:string}
const KEY='xunji_events'
export function getEvents():XunjiEvent[]{if(typeof window==='undefined')return[];try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
export function trackEvent(event:Omit<XunjiEvent,'time'>){
 const events=getEvents(),now=Date.now(),last=events[events.length-1]
 if(event.type==='page_view'&&last?.type==='page_view'&&last.page===event.page&&now-new Date(last.time).getTime()<800)return
 const next=[...events,{...event,time:new Date(now).toISOString()}].slice(-5000)
 localStorage.setItem(KEY,JSON.stringify(next))
 window.dispatchEvent(new CustomEvent('xunji:analytics'))
}
