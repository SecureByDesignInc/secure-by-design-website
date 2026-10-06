// Records one traffic process as a video clip, with optional captions and branding composited over the 3D scene.
const formats={
 landscape:{w:1920,h:1080,insets:{top:.15,bottom:.24},label:'Landscape 16:9'},
 vertical:{w:1080,h:1920,insets:{top:.19,bottom:.25},label:'Vertical 9:16'}
};
// Prefer H.264 MP4 (accepted by TikTok and Instagram). Some browsers report plain 'video/mp4' but write VP9, so it is a last resort.
const types=['video/mp4;codecs=avc1.640028','video/mp4;codecs=avc1.4D401F','video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
const policyColors={traffic:'#7fe0b7',pending:'#e6bc82',manual:'#e6bc82',deny:'#ee9294',unreachable:'#ee9294',rejected:'#ee9294'};
const font='Inter,Segoe UI,Arial,sans-serif';

// Browsers write WebM recordings without a Duration, which some players and editors mishandle.
// Insert Segment > Info > Duration (milliseconds at the default 1 ms timecode scale).
export async function addWebmDuration(blob,durationMs){
 const bytes=new Uint8Array(await blob.arrayBuffer());
 const width=(pos,max)=>{let length=1,mask=0x80;while(length<=max&&!(bytes[pos]&mask)){mask>>=1;length++;}return length<=max?{length,mask}:null;};
 const readId=pos=>{const w=width(pos,4);if(!w)return null;let id=0;for(let i=0;i<w.length;i++)id=id*256+bytes[pos+i];return {length:w.length,id};};
 const readSize=pos=>{const w=width(pos,8);if(!w)return null;let value=bytes[pos]&(w.mask-1);for(let i=1;i<w.length;i++)value=value*256+bytes[pos+i];return {length:w.length,value,unknown:value===2**(7*w.length)-1};};
 let header=readId(0),size=header&&readSize(header.length);if(header?.id!==0x1A45DFA3||!size)return blob;
 const segmentAt=header.length+size.length+size.value,segment=readId(segmentAt),segmentSize=segment&&readSize(segmentAt+segment.length);
 if(segment?.id!==0x18538067||!segmentSize)return blob;
 let at=segmentAt+segment.length+segmentSize.length;const segmentEnd=segmentSize.unknown?bytes.length:at+segmentSize.value;
 while(at<segmentEnd){
  const child=readId(at),childSize=child&&readSize(at+child.length);if(!childSize||childSize.unknown)return blob;
  const start=at+child.length+childSize.length,end=start+childSize.value;
  if(child.id===0x1549A966){
   for(let q=start;q<end;){const c=readId(q),cs=c&&readSize(q+c.length);if(!cs)return blob;if(c.id===0x4489)return blob;q+=c.length+cs.length+cs.value;}
   const duration=new Uint8Array(11);duration.set([0x44,0x89,0x88]);new DataView(duration.buffer).setFloat64(3,durationMs);
   const sized=new Uint8Array(8);sized[0]=1;let value=childSize.value+duration.length;for(let i=7;i>0;i--){sized[i]=value%256;value=Math.floor(value/256);}
   return new Blob([bytes.subarray(0,at+child.length),sized,bytes.subarray(start,end),duration,bytes.subarray(end)],{type:blob.type});
  }
  at=end;
 }
 return blob;
}

export function createClipRecorder({getScene,sequences,play,current,toast,onState}){
 const $=id=>document.getElementById(id);
 const supported=typeof MediaRecorder!=='undefined'&&typeof HTMLCanvasElement!=='undefined'&&'captureStream' in HTMLCanvasElement.prototype;
 const mimeType=supported?types.find(type=>MediaRecorder.isTypeSupported(type))||'':'';
 const container=mimeType.includes('mp4')?'MP4':'WebM';
 const logo=new Image();logo.src='/brand-lock.svg';
 let state=null;

 const select=$('clipProcess');
 const groups=[['Traffic processes',sequences.filter(s=>!s.whatIf)],['What if…',sequences.filter(s=>s.whatIf)]];
 for(const [label,items] of groups){const group=document.createElement('optgroup');group.label=label;for(const s of items)group.append(new Option(`${s.label} · ${s.steps.length} ${s.steps.length===1?'step':'steps'}`,String(sequences.indexOf(s))));select.append(group);}
 function estimate(){const s=sequences[Number(select.value)];$('clipEstimate').textContent=supported&&mimeType?`About ${s.steps.length*10} seconds · saves as ${container}.${container==='WebM'?' YouTube accepts WebM; TikTok and Instagram need MP4, so convert it first or record in Safari or a recent Chrome.':''}`:'Clip recording isn’t supported in this browser. Try a current version of Chrome, Edge, or Safari.';$('clipStart').disabled=!supported||!mimeType;}
 select.onchange=estimate;
 $('clipForm').onsubmit=event=>{event.preventDefault();$('clipDialog').close();start(Number(select.value),new FormData($('clipForm')).get('clipFormat'),$('clipCaptions').checked);};
 $('recordingStop').onclick=()=>stop(true);

 function open(index){select.value=String(index);estimate();$('clipDialog').showModal();}

 function start(index,formatName,captions){
  const scene=getScene(),format=formats[formatName];
  if(!scene||!supported||!mimeType){toast('Clip recording isn’t available here. Try a current version of Chrome, Edge, or Safari.');return;}
  const canvas=document.createElement('canvas');canvas.width=format.w;canvas.height=format.h;const ctx=canvas.getContext('2d');
  const sequence=sequences[index];
  let recorder;
  try{recorder=new MediaRecorder(canvas.captureStream(30),{mimeType,videoBitsPerSecond:12e6});}
  catch{toast('Clip recording could not start in this browser.');return;}
  state={recorder,chunks:[],sequence,formatName,started:false,stopping:false,save:true,startedAt:performance.now()};
  const session=state;
  recorder.ondataavailable=event=>{if(event.data.size)session.chunks.push(event.data);};
  recorder.onstop=()=>finish(session);
  scene.setOutput({w:format.w,h:format.h,insets:captions?format.insets:{top:0,bottom:0}});
  scene.setForceActive(true);
  scene.setFrameHook(source=>{ctx.drawImage(source,0,0,format.w,format.h);if(captions)drawCaptions(ctx,format,current());});
  play(index);state.started=true;
  recorder.start(500);state.recordingStarted=performance.now();
  $('recordingStatus').hidden=false;onState(true);
  state.timer=setInterval(()=>{const seconds=Math.floor((performance.now()-state.startedAt)/1000);$('recordingTime').textContent=`REC ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;},250);
  state.limit=setTimeout(()=>stop(true),(sequence.steps.length*10+8)*1000);
 }
 // Called before each step change: the clip ends when the sequence returns to its first step.
 function beforeStep(stepIndex){if(state?.started&&!state.stopping&&stepIndex===0)stop(true);}
 function stop(save=true){
  if(!state||state.stopping)return;
  state.stopping=true;state.save=save;state.durationMs=performance.now()-(state.recordingStarted||state.startedAt);clearInterval(state.timer);clearTimeout(state.limit);
  const scene=getScene();scene?.setFrameHook(null);scene?.setOutput(null);scene?.setForceActive(false);
  $('recordingStatus').hidden=true;$('recordingTime').textContent='REC 0:00';
  onState(false);
  if(state.recorder.state!=='inactive')state.recorder.stop();else finish(state);
 }
 async function finish(session){
  if(!session)return;if(state===session)state=null;const {chunks,save,sequence,formatName,durationMs}=session;
  if(!save){toast('Recording cancelled.');return;}
  if(!chunks.length){toast('The clip was empty. Please try again.');return;}
  const type=mimeType.split(';')[0];let blob=new Blob(chunks,{type});
  if(type==='video/webm'){try{blob=await addWebmDuration(blob,durationMs);}catch{}}
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.download=`inside-the-network-${sequence.id}-${formatName}.${container.toLowerCase()}`;link.href=url;link.hidden=true;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  toast(`Clip downloaded (${container})`);
 }

 function wrap(ctx,text,maxWidth,maxLines){
  const lines=[];let line='';
  for(const word of text.split(' ')){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}
  if(line)lines.push(line);
  if(lines.length>maxLines){lines.length=maxLines;lines[maxLines-1]=lines[maxLines-1].replace(/\s*\S*$/,'')+'…';}
  return lines;
 }
 function drawCaptions(ctx,{w,h},{sequence,step,stepIndex,policy,progress}){
  const portrait=h>w,u=portrait?w/1080:h/1080,margin=(portrait?64:72)*u,n=sequence.steps.length;
  ctx.save();ctx.textBaseline='alphabetic';
  let shade=ctx.createLinearGradient(0,0,0,(portrait?470:250)*u);shade.addColorStop(0,'rgba(4,10,19,.9)');shade.addColorStop(1,'rgba(4,10,19,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,(portrait?470:250)*u);
  const bottom=(portrait?560:320)*u;shade=ctx.createLinearGradient(0,h-bottom,0,h);shade.addColorStop(0,'rgba(4,10,19,0)');shade.addColorStop(.45,'rgba(4,10,19,.82)');shade.addColorStop(1,'rgba(4,10,19,.94)');ctx.fillStyle=shade;ctx.fillRect(0,h-bottom,w,bottom);
  // Header: brand and process title
  const logoSize=(portrait?64:56)*u;if(logo.complete&&logo.naturalWidth)ctx.drawImage(logo,margin,(portrait?62:48)*u,logoSize,logoSize);
  ctx.fillStyle='#68ddf0';ctx.font=`600 ${(portrait?25:22)*u}px ${font}`;if('letterSpacing' in ctx)ctx.letterSpacing=`${3*u}px`;
  ctx.fillText('SECURE BY DESIGN · INSIDE THE NETWORK',margin+logoSize+18*u,(portrait?104:86)*u);if('letterSpacing' in ctx)ctx.letterSpacing='0px';
  ctx.fillStyle='#f3f9ff';ctx.font=`600 ${(portrait?64:50)*u}px ${font}`;
  const titleLines=wrap(ctx,sequence.title,w-margin*2,portrait?3:1),titleTop=(portrait?206:150)*u,titleLead=(portrait?76:58)*u;
  titleLines.forEach((line,i)=>ctx.fillText(line,margin,titleTop+i*titleLead));
  // Footer: current step, protocol, and policy decision
  ctx.font=`600 ${(portrait?56:44)*u}px ${font}`;const stepLines=wrap(ctx,step.title,w-margin*2,2),stepLead=(portrait?66:52)*u;
  const policyY=h-(portrait?150:62)*u,protocolY=policyY-(portrait?52:40)*u,stepBottom=protocolY-(portrait?56:46)*u,stepTop=stepBottom-(stepLines.length-1)*stepLead,eyebrowY=stepTop-(portrait?64:50)*u;
  ctx.fillStyle='#68ddf0';ctx.font=`600 ${(portrait?26:22)*u}px ${font}`;if('letterSpacing' in ctx)ctx.letterSpacing=`${3*u}px`;
  ctx.fillText(`${sequence.whatIf?'WHAT IF · ':''}${sequence.label.toUpperCase()} · STEP ${stepIndex+1} OF ${n}`,margin,eyebrowY);if('letterSpacing' in ctx)ctx.letterSpacing='0px';
  ctx.fillStyle='#f3f9ff';ctx.font=`600 ${(portrait?56:44)*u}px ${font}`;stepLines.forEach((line,i)=>ctx.fillText(line,margin,stepTop+i*stepLead));
  ctx.fillStyle='#a8c7db';ctx.font=`500 ${(portrait?32:27)*u}px ${font}`;ctx.fillText(wrap(ctx,step.protocol,w-margin*2,1)[0],margin,protocolY);
  ctx.fillStyle=policyColors[policy.kind]||'#a8c7db';ctx.font=`600 ${(portrait?30:25)*u}px ${font}`;ctx.fillText(policy.label,margin,policyY);
  ctx.fillStyle='#8eabc2';ctx.font=`500 ${(portrait?26:22)*u}px ${font}`;
  if(portrait)ctx.fillText('securebydesigninc.com',margin,h-82*u);else{ctx.textAlign='right';ctx.fillText('securebydesigninc.com',w-margin,policyY);ctx.textAlign='left';}
  // Progress through the whole sequence
  const barY=h-(portrait?30:16)*u,barH=6*u;ctx.fillStyle='rgba(104,221,240,.18)';ctx.fillRect(0,barY,w,barH);ctx.fillStyle=sequence.color;ctx.fillRect(0,barY,w*Math.min(1,(stepIndex+progress)/n),barH);
  ctx.restore();
 }
 return {supported:supported&&!!mimeType,open,beforeStep,stop,get active(){return !!state&&!state.stopping;}};
}
