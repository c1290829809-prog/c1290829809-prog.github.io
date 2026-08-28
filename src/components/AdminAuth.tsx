import {createContext,useContext,useEffect,useMemo,useState} from 'react'
import type {Session,User} from '@supabase/supabase-js'
import {Navigate,Outlet,useLocation} from 'react-router-dom'
import {cloudEnabled,getSession,isCurrentUserAdmin,supabase} from '../services/supabase'

type AuthValue={session:Session|null;user:User|null;isAdmin:boolean;loading:boolean;signIn:(email:string,password:string)=>Promise<void>;signOut:()=>Promise<void>}
const AuthContext=createContext<AuthValue|null>(null)

export function SupabaseAuthProvider({children}:{children:React.ReactNode}){
 const[session,setSession]=useState<Session|null>(null),[isAdmin,setIsAdmin]=useState(false),[loading,setLoading]=useState(true)
 useEffect(()=>{let active=true;const apply=async(next:Session|null)=>{if(!active)return;setSession(next);try{setIsAdmin(next?await isCurrentUserAdmin():false)}catch(error){console.error('管理员权限校验失败',error);setIsAdmin(false)}finally{if(active)setLoading(false)}};void getSession().then(apply).catch(()=>setLoading(false));const subscription=supabase?.auth.onAuthStateChange((_event,next)=>{window.setTimeout(()=>{void apply(next)},0)}).data.subscription;return()=>{active=false;subscription?.unsubscribe()}},[])
 const value=useMemo<AuthValue>(()=>({session,user:session?.user||null,isAdmin,loading,signIn:async(email,password)=>{if(!cloudEnabled||!supabase)throw new Error('Supabase 未配置');const{data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw new Error(error.message);if(!data.session)throw new Error('登录失败，请重试');try{if(!await isCurrentUserAdmin())throw new Error('该账号没有循迹后台管理员权限')}catch(error){await supabase.auth.signOut();throw error}setSession(data.session);setIsAdmin(true)},signOut:async()=>{if(supabase)await supabase.auth.signOut();setSession(null);setIsAdmin(false)}}),[session,isAdmin,loading])
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAdminAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AdminAuthProvider 缺失');return value}

export function AdminGuard(){const{loading,session,isAdmin}=useAdminAuth(),location=useLocation();if(loading)return <main className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-slate-500">正在验证管理员身份…</main>;if(!session||!isAdmin)return <Navigate to="/admin/login" replace state={{from:location.pathname}}/>;return <Outlet/>}
