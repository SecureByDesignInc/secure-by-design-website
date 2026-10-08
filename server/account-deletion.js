// Deletes a learner's account and everything tied to it. Children first: D1 enforces foreign keys.
// Kept: an unsubscribed resource-email record (so we never email that address again) and form
// submissions, which are handled separately on request.
export async function deleteAccount(env,account){
 const now=new Date().toISOString();
 await env.DB.batch([
  env.DB.prepare('DELETE FROM reader_sessions WHERE account_id=?').bind(account.id),
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
}
