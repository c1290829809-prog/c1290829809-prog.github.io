import {MapPinned} from 'lucide-react'

export function MapPreview({lng,lat}:{lng:number;lat:number}){
 return <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-100 px-5 text-center">
  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-accent shadow-soft"><MapPinned size={21}/></span>
  <p className="mt-3 text-sm font-semibold text-stone-700">地图预览位置</p>
  <p className="mt-1 text-xs text-stone-500">高德地图暂未接入</p>
  <p className="mt-2 text-[11px] text-stone-400">{lng.toFixed(6)}, {lat.toFixed(6)}</p>
 </div>
}
