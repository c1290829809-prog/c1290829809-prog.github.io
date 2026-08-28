import {useEffect} from 'react'
import {cloudEnabled,isCurrentUserAdmin,readCloud,readTable,supabase} from '../services/supabase'
import {replaceEvents} from '../services/analytics'
import {useAdminStore,useBasicDataStore,useFeedbackStore} from '../stores'
import type {AdminPlace,Feedback,ManagedCity,ManagedIdol,ManagedWork} from '../stores'
export function CloudSync(){
 useEffect(()=>{
  if(!cloudEnabled||!supabase)return
  let disposed=false
  const load=async()=>{try{const cloud=await readCloud();if(disposed)return;useAdminStore.getState().hydrateRecords(cloud.places as AdminPlace[]);useBasicDataStore.getState().hydrate({idols:cloud.idols as ManagedIdol[],works:cloud.works as ManagedWork[],cities:cloud.cities as ManagedCity[]});if(await isCurrentUserAdmin()){const[feedback,events]=await Promise.all([readTable<Feedback>('feedback'),readTable('events')]);if(disposed)return;useFeedbackStore.getState().hydrate(feedback);replaceEvents(events)}}catch(error){console.error('云端数据加载失败',error)}}
  void load();const{data:{subscription}}=supabase.auth.onAuthStateChange(()=>{window.setTimeout(()=>{void load()},0)});return()=>{disposed=true;subscription.unsubscribe()}
 },[])
 return null
}
