export const groups=[
 {title:'Your background',fields:[['name','Name','text',120,true],['email','Email address','email',254,true],['timeZone','Time zone','text',100],['contactPreferences','Best days, times, or preferences for contact','text',300],['currentSituation','What are you doing now?','textarea',3000,false,'Your current work, studies, or other circumstances you’d like to share.'],['background','Share your background','textarea',5000,false,'Past roles, education, training, or experiences that have shaped your career.'],['strengths','What skills or experience do you want to build on?','textarea',3000]]},
 {title:'Your career aspirations',fields:[['aspirations','What would you like to be doing in your career?','textarea',4000,false,'The kind of work, responsibilities, or role you hope to move toward.'],['motivation','Why does that direction interest you?','textarea',3000],['currentEfforts','What have you already done or started toward it?','textarea',3000],['obstacles','What could make it difficult to move forward?','textarea',3000,false,'Include time or resource limits and anything else you want us to take into account.'],['discussion','How can we help you?','textarea',3000]]},
 {title:'Goals and follow-up, if you’re ready',optional:true,fields:[['goal1','Goal 1','textarea',1500],['goal1Date','Target date','date',10],['goal1Progress','What will show that you have made progress?','textarea',1500],['goal1Action','Your next action','textarea',1500],['goal2','Goal 2, if useful','textarea',1500],['goal2Date','Target date','date',10],['goal2Progress','What will show that you have made progress?','textarea',1500],['goal2Action','Your next action','textarea',1500],['accountability','What support would help you stay accountable?','textarea',1500],['checkInFrequency','How often would you like us to check in?','text',150]]}
];
export const labels=Object.fromEntries(groups.flatMap(g=>g.fields.map(f=>[f[0],f[1]])));

// The public intake is shorter; retain the full field catalogue for existing private records.
export const intakeFields=[
 ['name','Name','text',120,true],
 ['email','Email','email',254,true],
 ['aspirations','What would you like to be doing in your career?','textarea',4000,false],
 ['discussion','How can we help you?','textarea',3000,false]
];
