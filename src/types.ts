import type { Timestamp } from 'firebase/firestore';
export type MessageType = 'information'|'warning'|'closed'|'maintenance';
export type Priority = 'normal'|'important'|'urgent';
export type WeekdayKey = 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
export interface DayOpeningHours { enabled:boolean; open:string; close:string; lunchStart:string; lunchEnd:string }
export type OpeningHours = Record<WeekdayKey,DayOpeningHours>;
export interface ServiceMessage { id:string; title:string; body:string; type:MessageType; priority:Priority; startAt:Date|Timestamp; endAt:Date|Timestamp|null; enabled:boolean; createdAt?:Date|Timestamp; updatedAt?:Date|Timestamp }
const closedDay=():DayOpeningHours=>({enabled:false,open:'08:00',close:'16:00',lunchStart:'',lunchEnd:''});
export const DEFAULT_OPENING_HOURS:OpeningHours={monday:closedDay(),tuesday:closedDay(),wednesday:closedDay(),thursday:closedDay(),friday:closedDay(),saturday:closedDay(),sunday:closedDay()};
export interface DisplaySettings { slideDuration:number; transitionDuration:number; messageRotationTime:number; infoPanelWidth:number; slides:string[]; presentationId?:string; presentationName?:string; openingHours:OpeningHours }
export const DEFAULT_SETTINGS: DisplaySettings = { slideDuration:10, transitionDuration:800, messageRotationTime:10, infoPanelWidth:15, slides:[], presentationId:'', presentationName:'', openingHours:DEFAULT_OPENING_HOURS };
