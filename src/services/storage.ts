import {supabase} from './supabase'

export const MEDIA_BUCKET='xunji-media'
const MAX_FILE_SIZE=10*1024*1024

function extension(file:File){
 const fromName=file.name.split('.').pop()?.toLowerCase()
 if(fromName&&/^[a-z0-9]+$/.test(fromName))return fromName
 return file.type.split('/')[1]?.replace('jpeg','jpg')||'jpg'
}

export async function uploadMedia(file:File,folder:string){
 if(!supabase)throw new Error('云端图片服务尚未配置')
 if(!file.type.startsWith('image/'))throw new Error('请选择图片文件')
 if(file.size>MAX_FILE_SIZE)throw new Error('单张图片不能超过 10MB')
 const path=`${folder}/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${extension(file)}`
 const{data,error}=await supabase.storage.from(MEDIA_BUCKET).upload(path,file,{cacheControl:'31536000',contentType:file.type,upsert:false})
 if(error)throw new Error(`图片上传失败：${error.message}`)
 const{data:url}=supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path)
 return url.publicUrl
}
