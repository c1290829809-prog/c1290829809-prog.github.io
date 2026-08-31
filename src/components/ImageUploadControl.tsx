import {ImagePlus,LoaderCircle,Plus,Trash2,Upload} from 'lucide-react'
import {useRef,useState,type DragEvent} from 'react'
import {uploadMedia} from '../services/storage'

type Props={value:string;onChange:(value:string)=>void;folder:'places'|'idols'|'works'|'cities';multiple?:boolean}
const split=(value:string)=>value.split(/[,，]/).map(item=>item.trim()).filter(Boolean)

export function ImageUploadControl({value,onChange,folder,multiple=false}:Props){
 const inputRef=useRef<HTMLInputElement>(null),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[dragging,setDragging]=useState(false)
 const upload=async(files:FileList|null)=>{
  const list=Array.from(files||[])
  if(!list.length)return
  setUploading(true);setError('')
  try{
   const uploaded=await Promise.all(list.map(file=>uploadMedia(file,folder)))
   onChange(multiple?[...split(value),...uploaded].join('，'):uploaded[0])
  }catch(reason){setError(reason instanceof Error?reason.message:'图片上传失败')}
  finally{setUploading(false);if(inputRef.current)inputRef.current.value=''}
 }
 const handleDrop=(event:DragEvent<HTMLDivElement>)=>{
  event.preventDefault();setDragging(false)
  if(!uploading)void upload(event.dataTransfer.files)
 }
 const remove=(index:number)=>{
  const next=split(value).filter((_,itemIndex)=>itemIndex!==index)
  onChange(multiple?next.join('，'):'')
 }
 const preview=split(value)
 return <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
  <input ref={inputRef} type="file" accept="image/*" multiple={multiple} onChange={event=>void upload(event.target.files)} className="sr-only"/>
  <div onDragOver={event=>{event.preventDefault();if(!uploading)setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop} className={`flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-4 text-center transition ${dragging?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-200 bg-white text-slate-600'} ${uploading?'pointer-events-none opacity-70':''}`}>
   <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${dragging?'bg-blue-100':'bg-slate-100'}`}>{uploading?<LoaderCircle size={19} className="animate-spin"/>:<Upload size={19}/>}</span>
   <b className="text-sm">{uploading?'正在上传到循迹云端…':dragging?'松开即可上传':'拖拽图片到这里，或直接选择图片'}</b>
   <p className="mt-1 text-xs text-slate-400">JPG、PNG、WebP、GIF · 单张不超过 10MB</p>
   <button type="button" disabled={uploading} onClick={()=>inputRef.current?.click()} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
    <Plus size={15}/>{multiple?'选择图片':'选择图片'}
   </button>
  </div>
  {error&&<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
  {preview.length>0&&<div className="mt-3"><div className="mb-2 flex items-center justify-between"><b className="text-xs text-slate-600">已上传 {preview.length} 张</b>{multiple&&<span className="text-[11px] text-slate-400">可继续添加图片</span>}</div><div className="flex gap-2 overflow-x-auto pb-1">{preview.map((url,index)=><div key={`${url}-${index}`} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><img src={url} alt={`上传预览 ${index+1}`} className="h-full w-full object-cover" onError={event=>{event.currentTarget.style.display='none'}}/><ImagePlus className="absolute inset-0 m-auto -z-0 text-slate-300" size={20}/><button type="button" onClick={()=>remove(index)} aria-label={`移除第 ${index+1} 张图片`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/85 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14}/></button></div>)}</div></div>}
 </div>
}
