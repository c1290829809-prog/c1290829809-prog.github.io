import {Component,type ErrorInfo,type ReactNode} from 'react'
import {AlertTriangle,RefreshCw} from 'lucide-react'

export class AppErrorBoundary extends Component<{children:ReactNode},{error:string}>{
 state={error:''}
 static getDerivedStateFromError(error:Error){return{error:error.message||'页面运行异常'}}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('Xunji page error',error,info)}
 render(){
  if(!this.state.error)return this.props.children
  return <main className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center bg-paper p-6 text-ink"><section className="w-full rounded-2xl bg-white p-6 text-center shadow-soft"><AlertTriangle className="mx-auto text-accent" size={36}/><h1 className="mt-4 text-xl font-bold">页面加载失败</h1><p className="mt-2 break-words text-sm leading-6 text-stone-500">{this.state.error}</p><button onClick={()=>window.location.reload()} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-white"><RefreshCw size={18}/>重新加载</button></section></main>
 }
}
