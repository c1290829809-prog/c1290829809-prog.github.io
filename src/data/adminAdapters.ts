import type {Place,Relation,RelationType} from '../types'
import type {AdminPlace} from '../stores'

export function toPublicPlace(item:AdminPlace):Place{
 return {id:item.id,name:item.name,city:item.city,address:item.address,lng:item.lng,lat:item.lat,openInfo:item.openTime,visitable:item.visitable==='open'||item.visitable==='reservation',availability:item.visitable==='unknown'?undefined:item.visitable as Place['availability'],images:item.images.length?item.images:['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=82'],transportGuide:item.transportGuide,coreSpots:item.coreSpots,tips:item.tips}
}
export function toPublicRelation(item:AdminPlace):Relation{
 return {id:`relation-${item.id}`,placeId:item.id,relationType:item.relationType as RelationType,evidence:item.relationDesc,evidenceSource:item.evidence,credibility:item.credibility||'C'}
}
