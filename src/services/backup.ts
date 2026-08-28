import type {AdminPlace,ManagedCity,ManagedIdol,ManagedWork} from '../stores'
import type {XunjiEvent} from './analytics'
import {readTable,upsertRows} from './supabase'

export interface XunjiBackup{places:AdminPlace[];idols:ManagedIdol[];works:ManagedWork[];cities:ManagedCity[];events:XunjiEvent[]}
export interface BackupImportResult{expected:{places:number;idols:number;works:number;cities:number;events:number};cloud:{places:number;idols:number;works:number;cities:number;events:number}}

function parseJson(value:unknown){if(typeof value!=='string')return value;try{return JSON.parse(value)}catch{return null}}
function array(value:unknown){return Array.isArray(value)?value:[]}

export function parseXunjiBackup(raw:string):XunjiBackup{
 const root=parseJson(raw) as Record<string,unknown>|null
 const data=(root?.data&&typeof root.data==='object'?root.data:root) as Record<string,unknown>|null
 if(!data)throw new Error('备份文件格式不正确')
 const placeState=parseJson(data['xunji-admin-places']) as{state?:{records?:AdminPlace[]}}|null
 const legacyEvents=array(parseJson(data.xunji_events)) as Partial<XunjiEvent>[]
 const events=legacyEvents.map((event,index)=>({...event,id:event.id||`backup-event-${event.time||Date.now()}-${index}`})).filter((event):event is XunjiEvent=>Boolean(event.type&&event.time))
 const result={places:array(placeState?.state?.records) as AdminPlace[],idols:array(parseJson(data.xunji_idols)) as ManagedIdol[],works:array(parseJson(data.xunji_works)) as ManagedWork[],cities:array(parseJson(data.xunji_cities)) as ManagedCity[],events}
 if(!result.places.length&&!result.idols.length&&!result.works.length&&!result.cities.length)throw new Error('备份中没有找到地点、爱豆、作品或城市数据')
 return result
}

export async function importBackupToCloud(backup:XunjiBackup):Promise<BackupImportResult>{
 await Promise.all([upsertRows('places',backup.places),upsertRows('idols',backup.idols),upsertRows('works',backup.works),upsertRows('cities',backup.cities),upsertRows('events',backup.events)])
 const[places,idols,works,cities,events]=await Promise.all([readTable('places'),readTable('idols'),readTable('works'),readTable('cities'),readTable('events')])
 return{expected:{places:backup.places.length,idols:backup.idols.length,works:backup.works.length,cities:backup.cities.length,events:backup.events.length},cloud:{places:places.length,idols:idols.length,works:works.length,cities:cities.length,events:events.length}}
}
