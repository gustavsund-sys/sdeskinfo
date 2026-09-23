import { useEffect, useState } from 'react';
export function SlidePlayer({slides,duration,transition}:{slides:string[];duration:number;transition:number}){
 const list=slides; const [index,setIndex]=useState(0); const [failed,setFailed]=useState<Set<number>>(new Set());
 useEffect(()=>{if(!list.length)return;const id=setInterval(()=>setIndex(i=>(i+1)%list.length),Math.max(2,duration)*1000);return()=>clearInterval(id)},[list.length,duration]);
 useEffect(()=>{if(!list.length)return;const img=new Image();img.src=list[(index+1)%list.length]},[index,list]);
 useEffect(()=>{if(failed.has(index)&&failed.size<list.length)setIndex(i=>(i+1)%list.length)},[failed,index,list.length]);
 if(!list.length)return <div className="slide-player slide-player-empty" aria-label="Ingen presentation konfigurerad"/>;
 return <div className="slide-player" aria-label="Presentation">{list.map((src,i)=><img key={src+i} src={src} alt="" className={i===index?'slide active':'slide'} style={{transitionDuration:`${transition}ms`}} onError={()=>setFailed(v=>new Set(v).add(i))}/>)}</div>
}
