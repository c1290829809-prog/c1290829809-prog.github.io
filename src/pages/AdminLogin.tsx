import {FormEvent,useState} from 'react'
import {LockKeyhole,MapPin} from 'lucide-react'
import {Navigate,useLocation,useNavigate} from 'react-router-dom'
import {useAdminAuth} from '../components/AdminAuth'

export function AdminLoginPage(){
 const{session,isAdmin,loading,signIn}=useAdminAuth(),navigate=useNavigate(),location=useLocation()
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[submitting,setSubmitting]=useState(false),[error,setError]=useState('')
 const from=(location.state as{from?:string}|null)?.from||'/admin/dashboard'
 if(!loading&&session&&isAdmin)return <Navigate to={from} replace/>
 const submit=async(event:FormEvent)=>{event.preventDefault();if(submitting)return;setSubmitting(true);setError('');try{await signIn(email,password);navigate(from,{replace:true})}catch(reason){setError(reason instanceof Error?reason.message:'登录失败，请重试')}finally{setSubmitting(false)}}
 return <main className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-9 shadow-xl"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white"><MapPin/></span><div><h1 className="text-2xl font-black">循迹后台登录</h1><p className="mt-1 text-sm text-slate-500">仅限已授权管理员</p></div></div><label className="mt-8 block text-sm font-bold text-slate-700">管理员邮箱<input required type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-accent focus:ring-2 focus:ring-red-100" placeholder="name@example.com"/></label><label className="mt-5 block text-sm font-bold text-slate-700">密码<input required type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-accent focus:ring-2 focus:ring-red-100" placeholder="输入管理员密码"/></label>{error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}<button disabled={submitting||loading} className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white disabled:opacity-60"><LockKeyhole size={18}/>{submitting?'正在验证…':'安全登录'}</button><p className="mt-5 text-center text-xs leading-5 text-slate-400">账号由 Supabase Auth 管理。本站不提供公开注册入口。</p></form></main>
}
