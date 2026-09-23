import type { OpeningHours, WeekdayKey } from '../types';

const dayNames:Record<WeekdayKey,string>={monday:'måndag',tuesday:'tisdag',wednesday:'onsdag',thursday:'torsdag',friday:'fredag',saturday:'lördag',sunday:'söndag'};
const weekday=(date:Date)=>new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Stockholm',weekday:'long'}).format(date).toLowerCase() as WeekdayKey;
const currentMinutes=(date:Date)=>{const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);return Number(parts.find(p=>p.type==='hour')?.value)*60+Number(parts.find(p=>p.type==='minute')?.value)};
const minutes=(value:string)=>{const[h,m]=value.split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:-1};

export interface OpeningStatus { isOpen:boolean; status:'Öppet'|'Stängt'|'Lunchstängt'; detail:string }

export function getOpeningStatus(hours:OpeningHours,now=new Date()):OpeningStatus{
 const today=weekday(now);const schedule=hours[today];const time=currentMinutes(now);const open=minutes(schedule?.open??'');const close=minutes(schedule?.close??'');const lunchStart=minutes(schedule?.lunchStart??'');const lunchEnd=minutes(schedule?.lunchEnd??'');
 if(schedule?.enabled&&open>=0&&close>open&&time>=open&&time<close){
  if(lunchStart>=open&&lunchEnd>lunchStart&&lunchEnd<=close&&time>=lunchStart&&time<lunchEnd)return{isOpen:false,status:'Lunchstängt',detail:`Öppnar igen ${schedule.lunchEnd}`};
  const nextClose=lunchStart>time&&lunchEnd>lunchStart?`${schedule.lunchStart} för lunch`:schedule.close;
  return{isOpen:true,status:'Öppet',detail:`Öppet till ${nextClose}`};
 }
 if(schedule?.enabled&&open>=0&&time<open)return{isOpen:false,status:'Stängt',detail:`Öppnar idag ${schedule.open}`};
 for(let offset=1;offset<=7;offset++){const candidateDate=new Date(now.getTime()+offset*86400000);const key=weekday(candidateDate);const candidate=hours[key];if(candidate?.enabled&&minutes(candidate.open)>=0&&minutes(candidate.close)>minutes(candidate.open))return{isOpen:false,status:'Stängt',detail:`Öppnar ${dayNames[key]} ${candidate.open}`};}
 return{isOpen:false,status:'Stängt',detail:'Inga öppettider angivna'};
}
