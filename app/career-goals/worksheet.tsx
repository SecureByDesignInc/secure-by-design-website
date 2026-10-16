'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Download,FileText,CheckCircle2} from 'lucide-react';
import {GradientButton} from '../../components/saleshook/gradient-button';
const fields=[
 ['aspirations','Where would you like to go in your career?','A role, skill, change of direction, or simply figuring out what fits you.',true],
 ['discussion','What would you like help with?','For example: choosing a direction, building skills, reviewing a résumé, preparing for interviews, or working through a challenge.',true],
 ['currentSituation','Where are you starting from?','Share a little about your current work, studies, or experience.',false],
 ['obstacles','What is making it difficult to move forward?','Include time, resources, confidence, or anything else you want us to understand.',false],
 ['goal1Action','What is one next step you could take?','If you’re not sure yet, we can work through that together.',false],
] as const;
type Answers=Record<(typeof fields)[number][0],string>;
const empty:Answers={aspirations:'',discussion:'',currentSituation:'',obstacles:'',goal1Action:''};
type Submission=Answers&{submissionId:string;name:string;email:string;contactPreferences:string;storageAcknowledged:boolean;website:string};
function createSubmissionId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes].map(value=>value.toString(16).padStart(2,'0'));
 return hex.slice(0,4).join('')+'-'+hex.slice(4,6).join('')+'-'+hex.slice(6,8).join('')+'-'+hex.slice(8,10).join('')+'-'+hex.slice(10).join('');
}
export default function CareerWorksheet(){
 const [answers,setAnswers]=useState<Answers>(empty),[complete,setComplete]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[message,setMessage]=useState(''),[attempted,setAttempted]=useState(false),[reference,setReference]=useState(''),[ready,setReady]=useState(false);
 const pending=useRef<Submission|null>(null),resultHeading=useRef<HTMLHeadingElement>(null),savedHeading=useRef<HTMLHeadingElement>(null);
 const dirty=Object.values(answers).some(value=>value.length>0)&&!saved;
 useEffect(()=>{setReady(true);const preventLoss=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',preventLoss);return()=>window.removeEventListener('beforeunload',preventLoss);},[dirty]);
 const summary=()=>`SECURE BY DESIGN — CAREER GOALS & SUPPORT\n\n${fields.map(([key,label])=>label+'\n'+(answers[key].trim()||'To discuss together.')).join('\n\n')}\n\nKeep this worksheet for your career conversation. Saving a copy does not send a request or schedule a meeting.\n`;
 function download(){const url=URL.createObjectURL(new Blob([summary()],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='my-career-goals-and-support.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function requestHelp(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||saved)return;
  if(!pending.current){const data=new FormData(event.currentTarget);pending.current={...answers,submissionId:createSubmissionId(),name:String(data.get('name')||''),email:String(data.get('email')||''),contactPreferences:String(data.get('contactPreferences')||''),storageAcknowledged:data.get('consent')==='on',website:String(data.get('website')||'')};}
  setBusy(true);setAttempted(true);setMessage('');
  try{const response=await fetch('/api/career-submissions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(pending.current)});const result=await response.json() as {saved?:boolean;id?:string;error?:string};if(!response.ok||!result.saved){if(response.status===400){pending.current=null;setAttempted(false);}throw Error(result.error||'Your request could not be confirmed. Please try again.');}setSaved(true);setReference(result.id||'');setMessage('You’re part of the Secure By Design Community. Your career goals and request for help are saved for Secure By Design to review.');setTimeout(()=>savedHeading.current?.focus(),0);}
  catch(error){setMessage((error instanceof Error?error.message:'We could not confirm your request.')+(pending.current?' Your answers are still here. Retry sends the same request to avoid a duplicate.':' Your answers are still here. Check your details and try again.'));}
  finally{setBusy(false);}
 }
 return <main id="main" className="resource-page container">
  <nav className="resource-community-nav" aria-label="Community paths"><a href="/career-goals" aria-current="page"><span>PATH 01</span><b>Career Goals &amp; Support</b><small>Turn where you are into a useful next step.</small></a><a href="/careers#resources"><span>PATH 02</span><b>Cybersecurity Resources</b><small>Find practical material worth your time.</small></a><a href="/careers#contribute"><span>PATH 03</span><b>Share What You Know</b><small>Contribute a resource, lesson, or idea.</small></a></nav>
  <div className="resource-intro"><p className="resource-eyebrow">Community / Career Goals & Support</p><h1>Your career goals.<br/>Let’s work on what’s next.</h1><p>Tell us where you’d like to go and what you need a hand with. Put your thoughts into a worksheet, keep a copy, and choose whether to start a conversation with Secure By Design.</p></div>
  <div className="resource-layout"><div>
   {!complete?<form className="resource-card" aria-busy={!ready} onSubmit={event=>{event.preventDefault();if(!answers.aspirations.trim()||!answers.discussion.trim())return;setComplete(true);setTimeout(()=>resultHeading.current?.focus(),0);}}>
    <p className="resource-eyebrow">01 / Your goals & the help you need</p><h2>Where would you like to start?</h2><p className="resource-muted">Start with the first two questions. “I’m not sure yet” is a useful answer. Everything else is optional.</p>
    {fields.map(([key,label,hint,required])=><label className="resource-field" key={key}>{label}{!required&&' (optional)'}<span>{hint}</span><textarea required={required} readOnly={!ready} maxLength={1000} rows={3} value={answers[key]} onChange={e=>{const value=e.target.value;e.target.setCustomValidity(required&&value.length>0&&!value.trim()?'Please add a few words, or tell us you’re not sure yet.':'');setAnswers(previous=>({...previous,[key]:value}));}}/></label>)}
    <GradientButton type="submit" disabled={!ready}>Review my career worksheet <ArrowRight size={17}/></GradientButton><p className="resource-footnote">Your answers stay on this page until you choose to send them. Refreshing clears them. Share only details you’re comfortable including in a career conversation.</p>
   </form>:<div className="resource-card resource-results">
    <p className="resource-eyebrow">02 / Your career worksheet</p><h2 ref={resultHeading} tabIndex={-1}>A starting point for our conversation.</h2>
    <div className="resource-next"><CheckCircle2 size={24}/><div><h3>Your goals. Your questions. Your next step.</h3><p>Check that this reflects what you want to work on. You can save it for yourself or send it with a request for help below.</p></div></div>
    <dl className="resource-summary">{fields.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{answers[key].trim()||'To discuss together.'}</dd></div>)}</dl>
    <div className="resource-downloads"><button type="button" onClick={download}><Download size={18}/> Save my answers (.txt)</button><button type="button" onClick={()=>window.print()}><FileText size={18}/> Print / save answers as PDF</button><a href="/resources/career-goals-and-support.pdf" download><Download size={18}/> Reusable fillable worksheet (.pdf)</a></div>
    <p className="resource-footnote">You can keep your worksheet without sending a request.</p>
    {!attempted&&<button type="button" className="resource-edit" onClick={()=>{setComplete(false);setMessage('');}}>Edit my answers</button>}
   </div>}
   {complete&&<section className="resource-card resource-help"><p className="resource-eyebrow">03 / Request help with your career goals</p><h2 ref={savedHeading} tabIndex={-1}>{saved?'Your request is saved.':'Let’s start the conversation.'}</h2>
    {!saved?<><p>Share your worksheet and let us know how to reach you. Your goals and the assistance you’re looking for will guide the conversation.</p><form onSubmit={requestHelp}><div className="resource-contact"><label className="resource-field">Your name<input name="name" autoComplete="name" required maxLength={120} readOnly={attempted}/></label><label className="resource-field">Email<input type="email" name="email" autoComplete="email" required maxLength={254} readOnly={attempted}/></label></div><label className="resource-field">Best times or preferences for contact (optional)<span>If timing matters, include your time zone.</span><input name="contactPreferences" maxLength={300} readOnly={attempted}/></label><div className="resource-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="resource-consent"><input type="checkbox" name="consent" required disabled={attempted}/><span>Secure By Design may keep my career worksheet and contact details and contact me about my goals and request for help.</span></label><p className="resource-footnote">Submitting your email automatically enrolls you in Community. No payment details required. Your answers go to Secure By Design’s private career records. Sending this request does not schedule a meeting or sign you up for resource emails.</p><GradientButton type="submit" disabled={busy}>{busy?'Saving your request…':attempted?'Retry my request':'Request help with my career goals'}<ArrowRight size={17}/></GradientButton></form></>:<><p>Secure By Design can review your goals, the help you need, and your contact preferences together.</p><p className="resource-footnote">This request does not schedule a meeting. Keep any arrangements you’ve already made.</p><p className="resource-footnote">Record reference: {reference}</p></>}
    <p role="status" className={saved?'resource-success':'resource-status'}>{message}</p>
   </section>}
  </div><aside className="resource-sidebar"><section className="resource-card"><FileText size={30}/><h2>A conversation<br/>built around you.</h2><ol><li><strong>Share your goals.</strong><span>Where you’d like to go, even if you’re still figuring it out.</span></li><li><strong>Describe the help you need.</strong><span>A decision, a skill, an application, or something standing in your way.</span></li><li><strong>Choose to reach out.</strong><span>Send your worksheet so we have a useful starting point for a conversation.</span></li></ol><p className="resource-muted">You don’t need a polished plan or years of experience to get started.</p></section></aside></div>
 </main>;
}
