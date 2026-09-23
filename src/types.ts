import type { Timestamp } from 'firebase/firestore';
export type MessageType = 'information'|'warning'|'closed'|'maintenance';
export type Priority = 'normal'|'important'|'urgent';
export interface ServiceMessage { id:string; title:string; body:string; type:MessageType; priority:Priority; startAt:Date|Timestamp; endAt:Date|Timestamp|null; enabled:boolean; createdAt?:Date|Timestamp; updatedAt?:Date|Timestamp }
export interface DisplaySettings { slideDuration:number; transitionDuration:number; messageRotationTime:number; infoPanelWidth:number; slides:string[]; presentationId?:string; presentationName?:string }
export const DEFAULT_SETTINGS: DisplaySettings = { slideDuration:10, transitionDuration:800, messageRotationTime:10, infoPanelWidth:34, slides:[], presentationId:'', presentationName:'' };
