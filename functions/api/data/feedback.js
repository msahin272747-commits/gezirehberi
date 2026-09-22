import { cleanText, json, readCollection, storageError, verifySession, writeCollection } from './_store.js';
const KEY='kokus:feedback';
export async function onRequest({request,env}) {
 try {
  if(request.method==='POST'){let b;try{b=await request.json()}catch{return json({success:false,error:'Geçersiz JSON isteği.'},400)}const subject=cleanText(b.subject,100),message=cleanText(b.message,2000),username=cleanText(b.username,80);if(!message)return json({success:false,error:'Mesaj boş bırakılamaz.'},400);const list=await readCollection(env,KEY);list.unshift({id:crypto.randomUUID(),subject:subject||'Genel',message,username,createdAt:new Date().toISOString()});await writeCollection(env,KEY,list.slice(0,500));return json({success:true})}
  if(!await verifySession(request,env))return json({success:false,error:'Yetkisiz istek.'},401);
  const list=await readCollection(env,KEY);
  if(request.method==='GET')return json({success:true,feedback:list});
  if(request.method==='DELETE'){const id=new URL(request.url).searchParams.get('id');await writeCollection(env,KEY,list.filter(x=>x.id!==id));return json({success:true})}
  return json({success:false,error:'Yöntem desteklenmiyor.'},405)
 }catch(error){return storageError(error)}
}
