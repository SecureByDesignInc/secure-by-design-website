// Community enrollment is separate from authentication, resource-email consent, and the optional
// getting-started email sequence. Owner request, 16 October 2026: there are no membership tiers; every account
// is a free Community account. The table name and the {plan:'community'} response stay as they are because the
// installed app reads them.
export const communityMembership = Object.freeze({plan:'community',status:'active'});
const sources=new Set(['account','app','resources','career','contribution']);

export function communityEnrollmentStatement(env,email,source,{accountId=null,verified=false,recordId=null}={}){
 if(!env.DB)throw new Error('Community membership storage unavailable');
 if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||!sources.has(source))throw new Error('Invalid Community enrollment');
 if(accountId&&!verified)throw new Error('Account linking requires verified ownership');
 const recordTable=source==='career'?'career_records':source==='contribution'?'community_contributions':null;
 if(recordId&&!recordTable)throw new Error('Unsupported enrollment record');
 const now=new Date().toISOString();
 // A form's record and membership can commit together. A rejected or rate-limited
 // form creates neither; this statement must follow the record/outbox statements.
 const guard=recordId?`EXISTS (SELECT 1 FROM ${recordTable} WHERE id=?)`:'1';
 return env.DB.prepare(`INSERT INTO community_memberships (email,joined_at,source,account_id,verified_at)
  SELECT ?,?,?,?,? WHERE ${guard}
  ON CONFLICT(email) DO UPDATE SET
   account_id=COALESCE(community_memberships.account_id,excluded.account_id),
   verified_at=COALESCE(community_memberships.verified_at,excluded.verified_at)
  WHERE (community_memberships.account_id IS NULL AND excluded.account_id IS NOT NULL)
     OR (community_memberships.verified_at IS NULL AND excluded.verified_at IS NOT NULL)`)
  .bind(email.trim().toLowerCase(),now,source,accountId,verified?now:null,...(recordId?[recordId]:[]));
}

export async function enrollCommunity(env,email,source,options){
 await communityEnrollmentStatement(env,email,source,options).run();
 return communityMembership;
}

// Only call with a server-authenticated reader. No public lookup by email.
export async function readerCommunityMembership(env,reader,source='account'){
 await enrollCommunity(env,reader.email,source,{accountId:reader.id,verified:true});
 const row=await env.DB.prepare('SELECT joined_at FROM community_memberships WHERE account_id=? AND email=?').bind(reader.id,reader.email.trim().toLowerCase()).first();
 if(!row)throw new Error('Community membership unavailable');
 return {...communityMembership,joinedAt:row.joined_at};
}
