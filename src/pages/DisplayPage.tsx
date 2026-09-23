import { useEffect } from 'react';
import { DisplayCanvas } from '../components/DisplayCanvas'; import { useDisplayData,startHeartbeat } from '../hooks/useFirestoreData';
export function DisplayPage(){const {settings,messages}=useDisplayData();useEffect(()=>{const id=startHeartbeat();return()=>clearInterval(id)},[]);return <DisplayCanvas settings={settings} messages={messages}/>}
