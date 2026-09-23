import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SETTINGS, type DisplaySettings, type ServiceMessage } from '../types';
export function useDisplayData(){
 const [settings,setSettings]=useState(DEFAULT_SETTINGS); const [messages,setMessages]=useState<ServiceMessage[]>([]); const [connected,setConnected]=useState(true);
 useEffect(()=>onSnapshot(doc(db,'settings','display'),s=>{if(s.exists())setSettings({...DEFAULT_SETTINGS,...s.data()} as DisplaySettings)},()=>setConnected(false)),[]);
 useEffect(()=>onSnapshot(collection(db,'messages'),s=>{setMessages(s.docs.map(d=>({id:d.id,...d.data()} as ServiceMessage)));setConnected(true)},()=>setConnected(false)),[]);
 return {settings,messages,connected};
}
export function startHeartbeat(){
 const beat=()=>setDoc(doc(db,'displayStatus','main'),{lastSeen:serverTimestamp(),version:'1.0.0'},{merge:true}).catch(()=>undefined);
 beat(); return window.setInterval(beat,60000);
}
