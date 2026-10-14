import {useEffect,useState} from 'react'
import {useAdminAuth} from './AdminAuth'
import {readUserPreferences,saveUserPreferences} from '../services/supabase'
import {useFavoriteStore,useFollowingStore,useRouteStore} from '../stores'

export function UserPreferenceSync(){
 const{user}=useAdminAuth()
 const[readyUserId,setReadyUserId]=useState<string|null>(null)

 useEffect(()=>{
  let active=true
  setReadyUserId(null)
  if(!user)return()=>{active=false}
  void(async()=>{
   try{
    const cloud=await readUserPreferences(user.id)
    if(!active)return
    if(cloud){
     useFavoriteStore.getState().replace(cloud.favoritePlaceIds||[])
     useRouteStore.getState().replace(cloud.routePlaceIds||[])
     useFollowingStore.getState().replace(cloud.followedIdolIds||[])
    }else{
     await saveUserPreferences(user.id,snapshot())
    }
    if(active)setReadyUserId(user.id)
   }catch(error){console.error('个人数据初始化失败',error)}
  })()
  return()=>{active=false}
 },[user?.id])

 useEffect(()=>{
  if(!user||readyUserId!==user.id)return
  let timer:number|undefined
  const sync=()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>{void saveUserPreferences(user.id,snapshot()).catch(error=>console.error('个人数据同步失败',error))},500)}
  const unsubscribers=[useFavoriteStore.subscribe(sync),useRouteStore.subscribe(sync),useFollowingStore.subscribe(sync)]
  return()=>{window.clearTimeout(timer);unsubscribers.forEach(unsubscribe=>unsubscribe())}
 },[user?.id,readyUserId])

 return null
}

function snapshot(){return{favoritePlaceIds:useFavoriteStore.getState().placeIds,routePlaceIds:useRouteStore.getState().placeIds,followedIdolIds:useFollowingStore.getState().idolIds,updatedAt:new Date().toISOString()}}
