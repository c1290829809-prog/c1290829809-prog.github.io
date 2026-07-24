import AMapLoader from '@amap/amap-jsapi-loader'
export interface MapPoint{id:string;position:[number,number];title?:string}
let amapPromise:Promise<any>|null=null
function loadAMap(){
 const key=import.meta.env.VITE_AMAP_KEY
 if(!key) return Promise.reject(new Error('尚未配置高德地图 Key'))
 if(!amapPromise)amapPromise=AMapLoader.load({key,version:'2.0',plugins:['AMap.Driving','AMap.Walking','AMap.Geocoder']}).catch(error=>{amapPromise=null;throw error})
 return amapPromise
}
function withTimeout<T>(promise:Promise<T>,milliseconds=10000):Promise<T>{
 return Promise.race([promise,new Promise<T>((_,reject)=>setTimeout(()=>reject(new Error('坐标解析超时，请检查高德 Key 类型或网络后重试')),milliseconds))])
}
export function preloadAMap(){return withTimeout(loadAMap())}
export async function initMap(container:HTMLElement,options:Record<string,unknown>={}){
 const AMap=await withTimeout(loadAMap())
 return {AMap,map:new AMap.Map(container,{zoom:14,viewMode:'2D',...options})}
}
export function addMarker(AMap:any,map:any,position:[number,number],options:Record<string,unknown>={}){const marker=new AMap.Marker({position,...options});map.add(marker);return marker}
export function addMarkers(AMap:any,map:any,points:MapPoint[]){return points.map(p=>addMarker(AMap,map,p.position,{title:p.title}))}
export async function geocodeAddress(address:string,city='深圳'){
 const AMap=await withTimeout(loadAMap())
 const geocoder=new AMap.Geocoder({city})
 return withTimeout(new Promise<[number,number]>((resolve,reject)=>geocoder.getLocation(address,(status:string,result:any)=>{
  const location=result?.geocodes?.[0]?.location
  if(status==='complete'&&location) resolve([Number(location.lng),Number(location.lat)])
  else reject(new Error(result?.info==='INVALID_USER_KEY'?'当前高德 Key 无效或类型不匹配':'未解析到坐标，请补充更详细的地址'))
 })))
}
