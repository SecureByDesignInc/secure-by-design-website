'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import type {ReactNode} from 'react';
export type ReaderProfile={experience:string;goal:string;pace:string};
export type ReadingRecord={id:string;status:'in_progress'|'completed';updatedAt:string};
type ReaderState={user:{email:string;needsPassword:boolean}|null;membership?:{plan:'community';status:'active';joinedAt:string};profile:ReaderProfile|null;records:ReadingRecord[];bookmarks?:{id:string;saved:boolean;updatedAt:string}[]};
export const signInPath=(path:string)=>'/my-progress?returnTo='+encodeURIComponent(path)+'#account';
export function useReaderProgress(){
 const [data,setData]=useState<ReaderState|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{try{const response=await fetch('/api/reader-progress',{cache:'no-store'});const body=await response.json() as ReaderState & {error?:string};if(!response.ok)throw new Error(body.error);setData(body);setError('');}catch{setError('Your progress is unavailable. Please try again.');}},[]);
 useEffect(()=>{void refresh();const onFocus=()=>void refresh();window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus)},[refresh]);
 async function mutate(path:string,method:string,value?:unknown){setBusy(true);setError('');try{const response=await fetch('/api/reader-progress'+path,{method,headers:{'content-type':'application/json'},body:value===undefined?undefined:JSON.stringify(value)});const body=await response.json() as {error?:string};if(!response.ok)throw new Error(body.error);await refresh();return true;}catch(e){setError(e instanceof Error?e.message:'Could not save. Please try again.');return false;}finally{setBusy(false)}}
 return {data,error,busy,refresh,saveBookmark:(id:string,saved:boolean)=>mutate('/bookmarks/'+encodeURIComponent(id),'PUT',{saved}),save:(id:string,status:ReadingRecord['status'])=>mutate('/'+encodeURIComponent(id),'PUT',{status}),saveProfile:(profile:ReaderProfile)=>mutate('/profile','PUT',profile),clear:()=>mutate('','DELETE')};
}
const ProgressContext=createContext<ReturnType<typeof useReaderProgress>|null>(null);
export function ReadingProgressGroup({children}:{children:ReactNode}){
 const progress=useReaderProgress();
 return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>;
}
type ProgressProps={id:string;path:string;title?:string};
export function ReadingProgress(props:ProgressProps){
 const progress=useContext(ProgressContext);
 return progress?<ProgressControls {...props} progress={progress}/>:<IndividualProgress {...props}/>;
}
function IndividualProgress(props:ProgressProps){
 const progress=useReaderProgress();
 return <ProgressControls {...props} progress={progress}/>;
}
function ProgressControls({id,path,title,progress}:ProgressProps & {progress:ReturnType<typeof useReaderProgress>}){
 const {data,error,busy,refresh,save}=progress;const record=data?.records.find(item=>item.id===id);
 return <section className="reader-save" aria-label={title?title+' reading progress':'Reading progress'}>
  <div><strong>{record?.status==='completed'?'Completed':record?'In your reading list':'Your reading progress'}</strong><p>{data?.user?`Save this ${title?'section':'article'} to continue later, or mark it complete when you’re finished.`:'Sign in to keep your reading progress across devices.'}</p></div>
  {error?<div role="alert">{error} <button onClick={()=>void refresh()}>Try again</button></div>:!data?<span role="status">Loading progress…</span>:!data.user?<a href={signInPath(path)} target="_top">Sign in to save progress</a>:<div className="reader-actions">{!record&&<button disabled={busy} onClick={()=>void save(id,'in_progress')}>Save for later</button>}<button disabled={busy} onClick={()=>void save(id,record?.status==='completed'?'in_progress':'completed')}>{busy?'Saving…':record?.status==='completed'?'Mark incomplete':'Mark complete'}</button><a href="/my-progress">My Account →</a></div>}
 </section>;
}
