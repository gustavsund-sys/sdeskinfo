import { Timestamp } from 'firebase/firestore';
import type { ServiceMessage } from '../types';
export const toDate = (value: Date|Timestamp|null|undefined) => value instanceof Date ? value : value?.toDate?.() ?? null;
export const activeAt = (m:ServiceMessage, now=new Date()) => m.enabled && !!toDate(m.startAt) && toDate(m.startAt)!.getTime() <= now.getTime() && (!toDate(m.endAt) || now.getTime() < toDate(m.endAt)!.getTime());
export const upcomingAt = (m:ServiceMessage, now=new Date()) => m.enabled && !!toDate(m.startAt) && toDate(m.startAt)!.getTime() > now.getTime();
export const localInput = (date:Date) => { const offset=date.getTimezoneOffset()*60000; return new Date(date.getTime()-offset).toISOString().slice(0,16); };
export const swedishTime = (date:Date|null) => date ? new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'}).format(date) : 'Aldrig';
