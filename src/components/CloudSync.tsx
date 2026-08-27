import {useEffect,useRef} from 'react'
import {cloudEnabled,readCloud,writeTable} from '../services/supabase'
import {useAdminStore,useBasicDataStore} from '../stores'
import type {AdminPlace,ManagedCity,ManagedIdol,ManagedWork} from '../stores'
export function CloudSync(){
 const ready=useRef(false)
 useEffect(()=>{
  if(!cloudEnabled)return
  let disposed=false
  const push=()=>{if(!ready.current)return;const admin=useAdminStore.getState(),basic=useBasicDataStore.getState();void Promise.all([writeTable('places',admin.records),writeTable('idols',basic.idols),writeTable('works',basic.works),writeTable('cities',basic.cities)]).catch(()=>{})}
  const boot=async()=>{try{const cloud=await readCloud();if(disposed)return;const places=cloud.places as AdminPlace[],idols=cloud.idols as ManagedIdol[],works=cloud.works as ManagedWork[],cities=cloud.cities as ManagedCity[];const admin=useAdminStore.getState(),basic=useBasicDataStore.getState();if(places.length)admin.hydrateRecords(places);else void writeTable('places',admin.records);if(idols.length||works.length||cities.length)basic.hydrate({idols:idols.length?idols:basic.idols,works:works.length?works:basic.works,cities:cities.length?cities:basic.cities});else void Promise.all([writeTable('idols',basic.idols),writeTable('works',basic.works),writeTable('cities',basic.cities)]);ready.current=true}catch{ready.current=true} }
  void boot();const unsubAdmin=useAdminStore.subscribe(push),unsubBasic=useBasicDataStore.subscribe(push);return()=>{disposed=true;unsubAdmin();unsubBasic()}
 },[])
 return null
}
