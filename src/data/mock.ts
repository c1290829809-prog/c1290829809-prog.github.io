import type {Idol,Place,Relation,Work} from '../types'
const img=(seed:string,w=800)=>`https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&q=82`
export const idols:Idol[]=[
 {id:'zhou-shen',name:'周深',avatar:img('1534528741775-53994a69daeb',300),bio:'歌手，以清澈细腻的声线和多元舞台表达被大家喜爱。',city:'深圳'},
 {id:'wang-yibo',name:'王一博',avatar:img('1500648767791-00dcc994a43e',300),bio:'演员、歌手，热爱街舞、赛车与城市探索。',city:'深圳'},
 {id:'zhao-lusi',name:'赵露思',avatar:img('1531123897727-8f129e1688ce',300),bio:'演员，公开分享里常能看到松弛明亮的生活切片。',city:'深圳'}]
export const works:Work[]=[
 {id:'wind',name:'风起洛阳',type:'电视剧',year:2021,cover:img('1500530855697-b586d89ba3ee',500),description:'古都悬疑群像剧。'},
 {id:'sea',name:'星汉灿烂',type:'电视剧',year:2022,cover:img('1506744038136-46273834b3fb',500),description:'成长与家国交织的古装故事。'},
 {id:'stage',name:'奔跑吧·深圳篇',type:'综艺',year:2024,cover:img('1517245386807-bb43f82c33c4',500),description:'在深圳城市地标展开的户外挑战。'}]
const raw=[['talent','深圳人才公园','南山区科苑南路3329号',113.941,22.515,'06:00-23:00'],['bay','深圳湾公园','南山区滨海大道',113.951,22.503,'全天开放'],['sea-world','海上世界文化艺术中心','南山区望海路1187号',113.916,22.484,'10:00-22:00'],['nanhai','南海意库','南山区兴华路6号',113.919,22.490,'园区全天开放'],['oct','华侨城创意文化园','南山区锦绣北街2号',113.992,22.541,'全天开放'],['civic','市民中心','福田区福中三路',114.059,22.543,'广场全天开放'],['museum','深圳博物馆','福田区福中路市民中心A区',114.060,22.548,'10:00-18:00 周一闭馆'],['lianhua','莲花山公园','福田区红荔路6030号',114.050,22.555,'06:00-23:00'],['upperhills','深业上城','福田区皇岗路5001号',114.074,22.558,'10:00-22:00'],['pingan','平安金融中心云际观光层','福田区益田路5033号',114.055,22.533,'10:00-20:00'],['dongmen','东门老街','罗湖区解放路',114.118,22.546,'街区全天开放'],['mixc','深圳万象城','罗湖区宝安南路1881号',114.112,22.541,'10:00-22:00'],['dafen','大芬油画村','龙岗区大芬村',114.138,22.614,'09:00-18:00'],['gankeng','甘坑古镇','龙岗区甘李路18号',114.126,22.652,'全天开放'],['dapeng','大鹏所城','大鹏新区鹏城社区',114.479,22.596,'全天开放'],['jiaochangwei','较场尾','大鹏新区较场尾路',114.489,22.591,'全天开放'],['qianhai','前海石公园','南山区前湾一路',113.889,22.505,'06:00-23:00'],['happyharbor','欢乐港湾','宝安区新安街道海旺路',113.886,22.551,'10:00-22:00']]
export const places:Place[]=raw.map((p,i)=>({id:p[0] as string,name:p[1] as string,address:p[2] as string,lng:p[3] as number,lat:p[4] as number,openInfo:p[5] as string,visitable:true,images:[img(['1477959858617-67f85cf4f1df','1494526585095-c41746248156','1528127269322-539801943592'][i%3],900),img('1518005020951-eccb494ad742',900)]}))
const levels=['A','B','C','D'] as const
const kinds=['same_style','filming','public_event','personal_share'] as const
export const relations:Relation[]=places.map((p,i)=>({id:`r${i+1}`,placeId:p.id,idolId:idols[i%3].id,workId:i%4===1?works[i%3].id:undefined,relationType:kinds[i%4],evidence:i%4===0?'本人公开账号发布的照片可辨识同一建筑与视角。':i%4===1?'节目正片画面与公开取景资料相互印证。':i%4===2?'活动主办方公开物料与现场报道记录。':'来自公开用户投稿，建议到访前自行核验。',credibility:levels[i%4]}))
export const getIdol=(id?:string)=>idols.find(x=>x.id===id)
export const getPlace=(id?:string)=>places.find(x=>x.id===id)
export const getWork=(id?:string)=>works.find(x=>x.id===id)
