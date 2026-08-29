import {ImagePlus,LoaderCircle,Upload} from 'lucide-react'
import {useRef,useState} from 'react'
import {uploadMedia} from '../services/storage'

type Props={value:string;onChange:(value:string)=>void;folder:'places'|'idols'|'works'|'cities';multiple?:boolean}
const split=(value:string)=>value.split(/[,，]/).map(item=>item.trim()).filter(Boolean)

export function ImageUploadControl({value,onChange,folder,multiple=false}:Props){
 const inputRef=useRef<HTMLInputElement>(null),[uploading,setUploading]=useState(false),[error,setError]=useState('')
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
 const preview=split(value)
 return <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
  <input ref={inputRef} type="file" accept="image/*" multiple={multiple} onChange={event=>void upload(event.target.files)} className="sr-only"/>
  <div className="flex flex-wrap items-center gap-3">
   <button type="button" disabled={uploading} onClick={()=>inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
    {uploading?<LoaderCircle size={17} className="animate-spin"/>:<Upload size={17}/>}{uploading?'正在上传…':multiple?'选择并上传图片':'选择并上传图片'}
   </button>
   <span className="text-xs leading-5 text-slate-500">上传到循迹云端，支持 JPG、PNG、WebP、GIF；单张不超过 10MB。</span>
  </div>
  {error&&<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
  {preview.length>0&&<div className="mt-3 flex gap-2 overflow-x-auto">{preview.slice(0,5).map((url,index)=><div key={`${url}-${index}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white"><img src={url} alt="上传预览" className="h-full w-full object-cover" onError={event=>{event.currentTarget.style.display='none'}}/><ImagePlus className="absolute inset-0 m-auto -z-0 text-slate-300" size={20}/></div>)}</div>}
 </div>
}
