// Keep the non-extractable CryptoKey across reloads without storing credentials.
const MARKER='cyberorigin-session-v1', DB='cyberorigin-session-v1';
function database(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open(DB,1);
 request.onupgradeneeded=()=>request.result.createObjectStore('sessions');
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error);
 request.onblocked=()=>reject(Error('会话存储暂不可用'));
})}
async function access(mode,operation){
 const db=await database();
 try{return await new Promise((resolve,reject)=>{
  const transaction=db.transaction('sessions',mode),request=operation(transaction.objectStore('sessions'));
  transaction.oncomplete=()=>resolve(request.result);
  transaction.onerror=transaction.onabort=()=>reject(transaction.error||Error('会话存储失败'));
 })}finally{db.close()}
}
export async function rememberSession(key,salt){
 const previous=sessionStorage.getItem(MARKER),id=previous||crypto.randomUUID();
 await access('readwrite',store=>store.put({key,salt},id));
 try{sessionStorage.setItem(MARKER,id)}catch(error){await access('readwrite',store=>store.delete(id));throw error}
}
export async function readSession(){
 const id=sessionStorage.getItem(MARKER);
 return id?access('readonly',store=>store.get(id)):null;
}
export async function clearSession(){
 const id=sessionStorage.getItem(MARKER);
 sessionStorage.removeItem(MARKER);
 if(id)await access('readwrite',store=>store.delete(id));
}
