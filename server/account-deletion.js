// Deletes a learner's account and everything tied to it. Children first: D1 enforces foreign keys.
// Kept: an unsubscribed resource-email record (so we never email that address again) and form
// submissions, which are handled separately on request.
import {revokeAppleToken} from './oidc.js';
export async function deleteAccount(env,account,{fetcher=fetch}={}){
 const now=new Date().toISOString();
 const apple=await env.DB.prepare("SELECT refresh_token FROM reader_identities WHERE account_id=? AND provider='apple' AND refresh_token IS NOT NULL").bind(account.id).all();
 const systems="(SELECT id FROM auth_systems WHERE account_id=?)";
 await env.DB.batch([
  env.DB.prepare('DELETE FROM reader_sessions WHERE account_id=?').bind(account.id),
  // Authorization Workspace systems and everything recorded in them.
  ...['auth_history','auth_packages','auth_poam','auth_artifacts','auth_controls'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE system_id IN ${systems}`).bind(account.id)),
  env.DB.prepare('DELETE FROM auth_systems WHERE account_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM reader_progress WHERE user_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM reader_bookmarks WHERE user_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM reader_profiles WHERE user_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM reader_learning_activity WHERE user_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM app_email_enrollments WHERE account_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM reader_identities WHERE account_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM reader_passkeys WHERE account_id=?').bind(account.id),
  env.DB.prepare('DELETE FROM community_memberships WHERE account_id=? OR email=?').bind(account.id,account.email),
  env.DB.prepare('DELETE FROM reader_challenges WHERE email=?').bind(account.email),
  env.DB.prepare("UPDATE resource_subscribers SET name='',status='unsubscribed',unsubscribed_at=COALESCE(unsubscribed_at,?),confirmation_hash=NULL,confirmation_expires_at=NULL WHERE email=?").bind(now,account.email),
  env.DB.prepare('DELETE FROM reader_accounts WHERE id=?').bind(account.id)
 ]);
 // Best effort after the data is gone; Apple treats revocation as the end of the app's access.
 await Promise.all((apple.results||[]).map(row=>revokeAppleToken(env,row.refresh_token,fetcher)));
}
