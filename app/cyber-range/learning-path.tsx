'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import {useReaderProgress} from '../reader-progress';
import {validProfile} from '../../content/progress-catalog';
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Clock3, ExternalLink, Flag, Gauge, RotateCcw, Server, Shield, Target, Terminal } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Progress, ProgressLabel, ProgressValue } from '../../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';

type Profile = { experience: string; goal: string; pace: string };
type QuestionKey = keyof Profile;
type Module = { id:string; eyebrow:string; title:string; description:string; duration:string; type:string; href?:string; lab?:boolean };

const PROFILE_KEY = 'sbd-learning-profile-v1';
const PROGRESS_KEY = 'sbd-learning-progress-v1';
const LAB_PORTAL_URL = 'https://rthnqqv2d5.execute-api.us-east-1.amazonaws.com/';
// Enable only after the user authorizes opening the learning dashboard and labs.
const CYBER_RANGE_AVAILABLE = false;

const questions: Array<{key:QuestionKey; prompt:string; supporting:string; options:Array<{value:string;title:string;description:string}>}> = [
  { key:'experience', prompt:'Where are you starting?', supporting:'There is no wrong answer. This only changes what we put first.', options:[
    {value:'new',title:'I am building the foundations',description:'Start with the language, systems, and habits behind secure environments.'},
    {value:'hands-on',title:'I know the concepts',description:'Move quickly into commands, investigation, and configuration.'},
    {value:'practitioner',title:'I work in cybersecurity or IT',description:'Connect practical work to architecture, evidence, and risk decisions.'},
  ]},
  { key:'goal', prompt:'What do you want to understand first?', supporting:'Your answer changes the order of the path, not what you can access.', options:[
    {value:'infrastructure',title:'Infrastructure and identity',description:'Learn Active Directory, DNS, permissions, and the systems they depend on.'},
    {value:'defense',title:'Defensive operations',description:'Practice enumeration, monitoring, investigation, and validation.'},
    {value:'rmf',title:'Risk and compliance',description:'Connect technical decisions to controls, evidence, and the RMF lifecycle.'},
  ]},
  { key:'pace', prompt:'How do you want to work through it?', supporting:'The path stays available, so you can change pace whenever you need to.', options:[
    {value:'short',title:'Short focused sessions',description:'One clear idea or task at a time, usually under 30 minutes.'},
    {value:'guided',title:'A guided weekly path',description:'Move from explanation to practice in a deliberate sequence.'},
    {value:'sprint',title:'A hands-on project sprint',description:'Prioritize the lab and work backward into the supporting concepts.'},
  ]},
];

const modulesById: Record<string, Module> = {
  orientation:{id:'orientation',eyebrow:'Start here',title:'See the system behind the screen',description:'Build a shared mental model for identity, access, infrastructure, and defensive security.',duration:'12 min',type:'Read',href:'/inside-the-network'},
  lab:{id:'linux-discovery',eyebrow:'Invitation-only pilot',title:'Linux system discovery',description:'Use a browser terminal to explore your identity, Linux, file permissions, and sample login logs. An invited test account is required.',duration:'Up to 15 min',type:'Hands-on',lab:true},
  domain:{id:'domain',eyebrow:'Infrastructure',title:'Active Directory foundations',description:'Explore identities, directory services, and replication while configuring two domain controllers.',duration:'35 min',type:'Interactive guide',href:'/training/identity-foundation'},
  monitoring:{id:'monitoring',eyebrow:'Defensive operations',title:'Security monitoring as a lifecycle',description:'Connect SIEM, user and entity behavior analytics, incident response, and continuous monitoring.',duration:'25 min',type:'Interactive module',href:'https://secure-by-design-monitoring-lab.wladozer.chatgpt.site'},
  rmf:{id:'rmf',eyebrow:'Risk and compliance',title:'Follow the RMF lifecycle',description:'Move from preparation and categorization to controls, evidence, authorization, and monitoring.',duration:'12 modules',type:'Interactive course',href:'/grc-rmf-training/rmf/index.html'},
};

const orderByGoal: Record<string,string[]> = {
  infrastructure:['orientation','domain','lab','monitoring','rmf'],
  defense:['orientation','lab','monitoring','domain','rmf'],
  rmf:['orientation','rmf','domain','lab','monitoring'],
};
const goalCopy: Record<string,{title:string;description:string}> = {
  infrastructure:{title:'Build the systems. Then secure them.',description:'Your path begins with identity and infrastructure, then moves into hands-on validation and defensive operations.'},
  defense:{title:'Learn by investigating.',description:'Your path puts the live lab early, then connects what you observe to monitoring, identity, and risk.'},
  rmf:{title:'Connect the control to the system.',description:'Your path starts with the risk lifecycle, then grounds each decision in real infrastructure and practical validation.'},
};

function ChoiceIcon({question,value}:{question:QuestionKey;value:string}) {
  if(question==='experience') return value==='new'?<BookOpen/>:value==='hands-on'?<Terminal/>:<Shield/>;
  if(question==='goal') return value==='infrastructure'?<Server/>:value==='defense'?<Target/>:<CheckCircle2/>;
  return value==='short'?<Clock3/>:value==='guided'?<Gauge/>:<Flag/>;
}

function Onboarding({onComplete}:{onComplete:(profile:Profile)=>void}) {
  const [step,setStep]=useState(0);
  const [answers,setAnswers]=useState<Partial<Profile>>({});
  const question=questions[step];
  const selected=answers[question.key]||'';
  const percentage=Math.round(((step+1)/questions.length)*100);
  function next(){ if(!selected)return; if(step<questions.length-1)setStep(step+1); else onComplete(answers as Profile); }
  return <section className="path-onboarding" aria-labelledby="onboarding-title">
    <div className="path-progress-shell"><span>Build your path</span><div aria-hidden="true"><i style={{width:`${percentage}%`}}/></div><span>{step+1} / {questions.length}</span></div>
    <div className="path-onboarding-grid"><div className="path-question">
      <p className="path-kicker">A path that starts where you are</p><h1 id="onboarding-title">{question.prompt}</h1><p>{question.supporting}</p>
      <RadioGroup className="path-choice-list" value={selected} onValueChange={(value)=>setAnswers({...answers,[question.key]:value})} aria-label={question.prompt}>
        {question.options.map(option=><Label className="path-choice" key={option.value} data-selected={selected===option.value}>
          <RadioGroupItem value={option.value} aria-label={option.title}/><span className="path-choice-icon" aria-hidden="true"><ChoiceIcon question={question.key} value={option.value}/></span>
          <span><strong>{option.title}</strong><small>{option.description}</small></span>
        </Label>)}
      </RadioGroup>
      <div className="path-onboarding-actions">{step>0&&<Button type="button" variant="ghost" onClick={()=>setStep(step-1)}><ChevronLeft/> Back</Button>}<Button type="button" className="path-next" disabled={!selected} onClick={next}>{step===questions.length-1?'Build my path':'Continue'} <ArrowRight/></Button></div>
    </div><div className="path-terminal-card" aria-hidden="true"><div><span/><span/><span/></div><p>$ sbd path --personalize</p><p className={answers.experience?'is-ready':''}>experience <span>{answers.experience?'✓':'…'}</span></p><p className={answers.goal?'is-ready':''}>focus <span>{answers.goal?'✓':'…'}</span></p><p className={answers.pace?'is-ready':''}>pace <span>{answers.pace?'✓':'…'}</span></p><p className="path-terminal-output">{step===questions.length-1&&selected?'ready to build your route_':'listening for your next answer_'}</p></div></div>
  </section>;
}

function LabWorkspace() {
  return <section className="lab-launcher" aria-labelledby="lab-launcher-title">
    <div className="lab-launcher-heading"><div><p className="path-kicker">Invitation-only pilot</p><h2 id="lab-launcher-title">Explore Linux in a live lab</h2></div><span><Clock3/> Up to 15 minutes</span></div>
    <p className="lab-launcher-intro">The learning path is open to everyone. Live lab access is currently limited to the invited test account, with sign-in required before a session can start.</p>
    <ol className="lab-launch-steps">
      <li><span>01</span><div><h3>Open the lab portal and sign in</h3><p>The portal will ask you to confirm the three learning preferences again, then sign in with your invited account credentials. Public registration is not available during this pilot.</p><a className="lab-action-link" href={LAB_PORTAL_URL}>Continue to lab portal <ExternalLink/></a></div></li>
      <li><span>02</span><div><h3>Start your session</h3><p>After signing in, start the lab and open its browser terminal. Follow the four exercises to investigate your user identity, the operating system, file ownership, and sample login records.</p></div></li>
      <li><span>03</span><div><h3>Finish and stop the lab</h3><p>Submit your answers in the portal, stop the lab, and sign out when you finish. The lab also stops automatically after the session expires, even if you close the tab.</p></div></li>
    </ol>
    <div className="lab-objective"><Terminal/><div><strong>Learn by inspecting the system</strong><p>Practice basic Linux commands in a dedicated training environment. The login records are fictional examples for the exercise.</p></div></div>
    <div className="lab-finish"><p>Your lab answers stay in the portal. Return here to mark the module complete for your own reference; learning-path completion is self-reported and does not sync with lab assessment results.</p></div>
  </section>;
}

function Dashboard({profile,onReset,completed,toggleComplete,busy}:{profile:Profile;onReset:()=>void;completed:string[];toggleComplete:(id:string)=>void;busy:boolean}) {
  const modules=useMemo(()=>(orderByGoal[profile.goal]||orderByGoal.infrastructure).map(id=>modulesById[id]),[profile.goal]); const copy=goalCopy[profile.goal]||goalCopy.infrastructure;
  const percent=Math.round((completed.length/modules.length)*100); const nextModule=modules.find(module=>!completed.includes(module.id));
  return <div className="path-dashboard"><section className="path-dashboard-hero"><div className="container path-dashboard-hero-grid"><div><p className="path-kicker">Your Secure By Design path</p><h1>{copy.title}</h1><p>{copy.description}</p><div className="path-hero-actions"><a href="#your-path">Continue your path <ArrowRight/></a><button type="button" onClick={onReset}><RotateCcw/> Retake onboarding</button></div></div>
    <div className="path-status-card"><div><span>Current progress</span><strong>{percent}%</strong></div><Progress value={percent} aria-label={`${percent}% of learning path completed`}><ProgressLabel>Path progress</ProgressLabel><ProgressValue>{()=>`${completed.length} of ${modules.length}`}</ProgressValue></Progress><p>{nextModule?<>Next: <strong>{nextModule.title}</strong></>:<><strong>Path complete.</strong> Keep experimenting.</>}</p></div></div></section>
    <div className="container path-dashboard-body"><div id="lab-workspace"><LabWorkspace/></div><section className="path-roadmap" id="your-path" aria-labelledby="your-path-title"><div className="path-section-heading"><div><p className="path-kicker">Recommended for you</p><h2 id="your-path-title">Your learning path</h2></div><p>{profile.pace==='short'?'Built for short, focused sessions.':profile.pace==='sprint'?'The lab is available whenever you are ready to move faster.':'A deliberate route from concepts to practice.'}</p></div>
      <div className="path-module-list">{modules.map((module,index)=>{const done=completed.includes(module.id);const Icon=module.lab?Terminal:module.id==='rmf'?Shield:module.id==='domain'?Server:module.id==='monitoring'?Target:BookOpen;return <article className="path-module" key={module.id} data-complete={done}><div className="path-module-index"><span>{done?<Check/>:String(index+1).padStart(2,'0')}</span><i/></div><div className="path-module-icon"><Icon/></div><div className="path-module-copy"><p>{module.eyebrow}</p><h3>{module.title}</h3><p>{module.description}</p><div><span><Clock3/> {module.duration}</span><span>{module.type}</span></div></div><div className="path-module-actions">{module.lab?<a href="#lab-workspace">View lab <ArrowRight/></a>:<a href={module.href}>Open module <ArrowRight/></a>}<button type="button" className="path-complete-button" disabled={busy} onClick={()=>toggleComplete(module.id)}>{done?'Completed':'Mark complete'} {done&&<CheckCircle2/>}</button></div></article>;})}</div>
    </section></div>
  </div>;
}

// Read browser-only progress after hydration so the server and initial client markup agree.
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function ClientLearningPath() {
  const cloud=useReaderProgress();
  const [guestProfile,setGuestProfile]=useState<Profile|null>(()=>{try{const value=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');return validProfile(value)?value:null}catch{return null}});
  const [guestCompleted,setGuestCompleted]=useState<string[]>(()=>{try{const value=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'[]');return Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'&&Object.values(modulesById).some(m=>m.id===id)))]:[]}catch{return []}});
  const [editing,setEditing]=useState(false),[importing,setImporting]=useState(false);
  const signedIn=!!cloud.data?.user;
  const profile=editing?null:signedIn?cloud.data?.profile:guestProfile;
  const completed=signedIn?(cloud.data?.records||[]).filter(r=>r.id.startsWith('path:')&&r.status==='completed').map(r=>r.id.slice(5)):guestCompleted;
  async function complete(nextProfile:Profile){if(signedIn){if(await cloud.saveProfile(nextProfile))setEditing(false)}else{try{localStorage.setItem(PROFILE_KEY,JSON.stringify(nextProfile))}catch{}setGuestProfile(nextProfile);setEditing(false)}}
  function reset(){setEditing(true);window.scrollTo({top:0,behavior:'smooth'})}
  async function toggleComplete(id:string){if(signedIn){await cloud.save('path:'+id,completed.includes(id)?'in_progress':'completed')}else{const next=completed.includes(id)?completed.filter(item=>item!==id):[...completed,id];setGuestCompleted(next);try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(next))}catch{}}}
  async function importProgress(){setImporting(true);try{if(guestProfile&&!cloud.data?.profile&&!(await cloud.saveProfile(guestProfile)))return;for(const id of guestCompleted)if(!(await cloud.save('path:'+id,'completed')))return;setGuestProfile(null);setGuestCompleted([]);try{localStorage.removeItem(PROFILE_KEY);localStorage.removeItem(PROGRESS_KEY)}catch{}}finally{setImporting(false)}}
  if(!cloud.data)return <div className="reader-path-account" role="status">{cloud.error||'Loading your learning path…'}{cloud.error&&<button onClick={()=>void cloud.refresh()}>Try again</button>}</div>;
  return <>{signedIn&&<div className="reader-path-account"><strong>Your path is saved to your account</strong><p>Completed modules and your preferences stay with you when you sign in.</p><div className="reader-actions"><a href="/my-progress">My Account →</a>{(guestProfile||guestCompleted.length>0)&&<button disabled={importing||cloud.busy} onClick={()=>void importProgress()}>{importing?'Importing…':'Import progress from this browser'}</button>}</div>{cloud.error&&<p role="alert">{cloud.error}</p>}</div>}<fieldset disabled={cloud.busy||importing} style={{border:0,padding:0,margin:0,minWidth:0}}>{profile?<Dashboard profile={profile} onReset={reset} completed={completed} toggleComplete={id=>void toggleComplete(id)} busy={cloud.busy||importing}/>:<Onboarding onComplete={next=>void complete(next)}/>}</fieldset></>;
}

function DevelopmentPreview() {
  const [profile,setProfile]=useState<Profile|null>(null);
  if(!profile)return <><p className="path-preview-notice">Explore the three-step setup. Visit My Account to <a className="request-access-link" href="/my-progress">create an account or sign in</a>.</p><Onboarding onComplete={setProfile}/></>;
  return <section className="path-development" aria-labelledby="path-development-title">
    <div className="path-development-card">
      <div role="status"><p className="path-kicker">Setup complete</p><h1 id="path-development-title">Take the next step.</h1><p>You’ve finished building your path. Head to My Account to create an account or sign in. Cyber Range access is granted separately.</p></div>
      <dl>{questions.map(question=><div key={question.key}><dt>{question.key==='experience'?'Experience':question.key==='goal'?'Focus':'Pace'}</dt><dd>{question.options.find(option=>option.value===profile[question.key])?.title}</dd></div>)}</dl>
      <div className="path-request-actions"><a className="path-request-access" href="/my-progress">Request access</a><Button type="button" onClick={()=>setProfile(null)}>Build a different path</Button></div><p className="path-request-note"><a className="request-access-link" href="/my-progress">Create account / Sign in</a> through My Account.</p>
    </div>
  </section>;
}

export default function LearningPath() {
  const ready=useSyncExternalStore(subscribeToHydration,clientReady,serverReady);
  if(!CYBER_RANGE_AVAILABLE)return <DevelopmentPreview/>;
  return ready?<ClientLearningPath/>:<div className="path-loading"><span>Preparing your learning path…</span></div>;
}
