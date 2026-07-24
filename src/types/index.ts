export type Credibility='A'|'B'|'C'|'D'
export type RelationType='same_style'|'filming'|'public_event'|'personal_share'|'other'
export interface Idol {id:string;name:string;avatar:string;bio:string;city:string}
export interface Work {id:string;name:string;type:string;year:number;cover:string;description:string}
export interface Place {id:string;name:string;address:string;city?:string;lng:number;lat:number;openInfo:string;visitable:boolean|null;availability?:'open'|'reservation'|'closed'|'private';images:string[];transportGuide?:string;coreSpots?:string;tips?:string}
export interface Relation {id:string;placeId:string;idolId?:string;workId?:string;relationType:RelationType;evidence:string;evidenceSource?:string;credibility:Credibility}
