import {CheckCircle2,Database,History,ShieldCheck} from 'lucide-react'
import {useEffect,useState} from 'react'
import {Header} from '../components/ui'

export function SettingsPage(){
 const[reduced,setReduced]=useState(()=>localStorage.getItem('xunji-reduced-motion')==='1'),[notice,setNotice]=useState('')
 useEffect(()=>{document.documentElement.classList.toggle('xj-reduced-motion',reduced);localStorage.setItem('xunji-reduced-motion',reduced?'1':'0')},[reduced])
 const clearSearch=()=>{localStorage.removeItem('xunji_search_history');setNotice('搜索历史已清空');window.setTimeout(()=>setNotice(''),2200)}
 return <main className="min-h-[100dvh] bg-paper pb-10"><Header title="设置" back/><section className="mx-auto max-w-2xl px-5">
  <section className="rounded-[24px] bg-white p-5 shadow-soft"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck/></span><div><h2 className="font-bold">数据保存方式</h2><p className="mt-1 text-xs text-stone-500">公开内容来自 Supabase 云端</p></div></div><div className="mt-4 flex items-start gap-3 rounded-2xl bg-stone-50 p-4"><Database size={18} className="mt-0.5 shrink-0 text-orange-500"/><p className="text-xs leading-5 text-stone-500">访客收藏、关注、搜索历史和临时路线仅保存在当前浏览器；清理浏览器数据后会消失。</p></div></section>
  <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-soft"><label className="flex min-h-16 cursor-pointer items-center justify-between px-5"><span><b className="text-sm">减少动态效果</b><span className="mt-1 block text-xs text-stone-400">关闭大部分过渡与缩放动画</span></span><input type="checkbox" checked={reduced} onChange={event=>setReduced(event.target.checked)} className="h-5 w-5 accent-orange-500"/></label><button type="button" onClick={clearSearch} className="flex min-h-16 w-full items-center gap-3 border-t px-5 text-left"><History size={19}/><span className="text-sm font-semibold">清空搜索历史</span></button></section>
  {notice&&<div role="status" className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18}/>{notice}</div>}
 </section></main>
}
