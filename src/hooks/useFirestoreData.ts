import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_OPENING_HOURS, DEFAULT_SETTINGS, type DisplaySettings, type ServiceMessage, type WeekdayKey } from '../types';
const weekdayKeys:WeekdayKey[]=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
function settingsWithDefaults(data:Partial<DisplaySettings>):DisplaySettings{
 const storedHours=data.openingHours??DEFAULT_OPENING_HOURS;
 const openingHours={...DEFAULT_OPENING_HOURS};
 weekdayKeys.forEach(day=>{openingHours[day]={...DEFAULT_OPENING_HOURS[day],...storedHours[day]}});
 return {...DEFAULT_SETTINGS,...data,openingHours};
}
export function useDisplayData(){
 const [settings,setSettings]=useState(DEFAULT_SETTINGS); const [messages,setMessages]=useState<ServiceMessage[]>([]); const [connected,setConnected]=useState(true);
 useEffect(()=>onSnapshot(doc(db,'settings','display'),s=>{if(s.exists())setSettings(settingsWithDefaults(s.data() as Partial<DisplaySettings>))},()=>setConnected(false)),[]);
 useEffect(()=>onSnapshot(collection(db,'messages'),s=>{setMessages(s.docs.map(d=>({id:d.id,...d.data()} as ServiceMessage)));setConnected(true)},()=>setConnected(false)),[]);
 return {settings,messages,connected};
}
export function startHeartbeat(){
 const beat=()=>setDoc(doc(db,'displayStatus','main'),{lastSeen:serverTimestamp(),version:'1.0.0'},{merge:true}).catch(()=>undefined);
 beat(); return window.setInterval(beat,60000);
}
