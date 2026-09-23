import type { ServiceMessage } from '../types';
const now=Date.now();
export const DEMO_MESSAGES:ServiceMessage[]=[
 {id:'demo-1',title:'Ändrade öppettider',body:'Service desk stänger kl. 15:00 idag.',type:'information',priority:'normal',startAt:new Date(now-60000),endAt:new Date(now+86400000),enabled:true},
 {id:'demo-2',title:'Driftinformation',body:'Just nu förekommer störningar i utskriftssystemet.',type:'warning',priority:'important',startAt:new Date(now-60000),endAt:new Date(now+86400000),enabled:true},
 {id:'demo-3',title:'Planerat underhåll',body:'Vissa tjänster kan vara otillgängliga mellan 08:00 och 09:00.',type:'maintenance',priority:'normal',startAt:new Date(now+86400000),endAt:new Date(now+90000000),enabled:true}
];
