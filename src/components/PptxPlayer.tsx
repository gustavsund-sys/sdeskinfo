import { useEffect, useRef, useState } from 'react';
import { Bytes, collection, documentId, getDocs, orderBy, query } from 'firebase/firestore';
import type { PptxViewer } from '@aiden0z/pptx-renderer/browser';
import { db } from '../firebase';

export function PptxPlayer({presentationId,duration}:{presentationId:string;duration:number}){
 const containerRef=useRef<HTMLDivElement>(null); const viewerRef=useRef<PptxViewer|null>(null); const[failed,setFailed]=useState(false);
 useEffect(()=>{let cancelled=false;let timer=0;const controller=new AbortController();setFailed(false);
  async function load(){try{const snap=await getDocs(query(collection(db,'presentations',presentationId,'chunks'),orderBy(documentId())));if(cancelled||snap.empty)throw new Error('Presentation saknas');const chunks=snap.docs.map(d=>(d.data().data as Bytes).toUint8Array());const size=chunks.reduce((sum,c)=>sum+c.byteLength,0);const merged=new Uint8Array(size);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength}if(!containerRef.current||cancelled)return;const{PptxViewer,RECOMMENDED_ZIP_LIMITS}=await import('@aiden0z/pptx-renderer/browser');const viewer=await PptxViewer.open(merged.buffer,containerRef.current,{renderMode:'slide',fitMode:'contain',zipLimits:RECOMMENDED_ZIP_LIMITS,pdfjs:false,lazyMedia:true,lazySlides:true,signal:controller.signal});if(cancelled){viewer.destroy();return}viewerRef.current=viewer;if(viewer.slideCount>1)timer=window.setInterval(()=>viewer.goToSlide((viewer.currentSlideIndex+1)%viewer.slideCount).catch(()=>undefined),Math.max(2,duration)*1000)}catch(error){if(!cancelled){console.error('Kunde inte läsa PowerPoint-presentationen',error);setFailed(true)}}}load();return()=>{cancelled=true;controller.abort();clearInterval(timer);viewerRef.current?.destroy();viewerRef.current=null}},[presentationId,duration]);
 return <div className={`pptx-player ${failed?'pptx-player-failed':''}`} ref={containerRef} aria-label="PowerPoint-presentation"/>;
}
