import { cleanText, json, readCollection, storageError, verifySession, writeCollection } from './_store.js';
const KEY='kokus:sponsors';
async function body(request){try{return await request.json()}catch{return null}}
export async function onRequest({request,env}) {
 try {
  if(request.method==='GET'){const sponsors=await readCollection(env,KEY);return json({success:true,sponsors:sponsors.filter(x=>x.active!==false)})}
  if(!await verifySession(request,env))return json({success:false,error:'Yetkisiz istek.'},401);
  const list=await readCollection(env,KEY);
  if(request.method==='POST'||request.method==='PUT'){const b=await body(request);if(!b)return json({success:false,error:'Geçersiz JSON isteği.'},400);const item={id:cleanText(b.id,64)||crypto.randomUUID(),name:cleanText(b.name,80),logo:cleanText(b.logo,500),description:cleanText(b.description,300),link:cleanText(b.link,500),level:['Bronz','Gümüş','Altın'].includes(b.level)?b.level:'Bronz',active:b.active!==false};if(!item.name)return json({success:false,error:'Sponsor adı zorunludur.'},400);const i=list.findIndex(x=>x.id===item.id);if(i<0)list.push(item);else list[i]=item;await writeCollection(env,KEY,list);return json({success:true,sponsor:item})}
  if(request.method==='DELETE'){const id=new URL(request.url).searchParams.get('id');await writeCollection(env,KEY,list.filter(x=>x.id!==id));return json({success:true})}
  return json({success:false,error:'Yöntem desteklenmiyor.'},405)
 }catch(error){return storageError(error)}
}
