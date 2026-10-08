// The owner signs in with a reader account whose email is OWNER_EMAIL. Tests add that account and a browser
// session directly to the in-memory database, signed in `hoursAgo` hours ago.
import {createHash} from 'node:crypto';
export const ownerToken='0'.repeat(63)+'1';
export const ownerCookie={cookie:`__Host-sbd_reader=${ownerToken}`};
export const forgedOwnerHeaders=email=>({'oai-authenticated-user-id':'owner','oai-authenticated-user-email':email});
export function addOwnerSession(raw,email,{hoursAgo=0,token=ownerToken,id='owner-account'}={}){
  raw.prepare('INSERT OR IGNORE INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run(id,email,new Date().toISOString());
  const expires=new Date(Date.now()+30*86400000-hoursAgo*3600000).toISOString();
  raw.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').run(createHash('sha256').update(token).digest('hex'),id,expires);
}
