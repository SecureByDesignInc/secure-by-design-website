import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const readerAccounts=sqliteTable('reader_accounts',{id:text('id').primaryKey(),email:text('email').notNull().unique(),createdAt:text('created_at').notNull(),passwordHash:text('password_hash')});
export const communityMemberships=sqliteTable('community_memberships',{
 email:text('email').primaryKey(),joinedAt:text('joined_at').notNull(),source:text('source').notNull(),
 accountId:text('account_id').unique().references(()=>readerAccounts.id),verifiedAt:text('verified_at')
});
export const readerSessions=sqliteTable('reader_sessions',{tokenHash:text('token_hash').primaryKey(),accountId:text('account_id').notNull().references(()=>readerAccounts.id),expiresAt:text('expires_at').notNull(),clientKind:text('client_kind').notNull().default('browser')});

export const appEmailEnrollments=sqliteTable('app_email_enrollments',{
 accountId:text('account_id').notNull().references(()=>readerAccounts.id),sequence:text('sequence').notNull(),
 consentAt:text('consent_at').notNull(),consentVersion:text('consent_version').notNull(),consentText:text('consent_text').notNull(),
 state:text('state').notNull(),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.accountId,t.sequence]})]);
export const readerChallenges=sqliteTable('reader_challenges',{id:text('id').primaryKey(),email:text('email').notNull(),codeHash:text('code_hash').notNull(),attempts:integer('attempts').notNull().default(0),expiresAt:text('expires_at').notNull(),purpose:text('purpose').notNull().default('create')});
export const readerAuthLimits=sqliteTable('reader_auth_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:text('expires_at').notNull()});
export const readerProfiles=sqliteTable('reader_profiles',{
 userId:text('user_id').primaryKey(),profile:text('profile').notNull(),updatedAt:text('updated_at').notNull()
});
export const readerProgress=sqliteTable('reader_progress',{
 userId:text('user_id').notNull(),itemId:text('item_id').notNull(),status:text('status').notNull(),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.itemId]})]);
export const careerRecords=sqliteTable('career_records',{
 id:text('id').primaryKey(),requestHash:text('request_hash').notNull(),name:text('name').notNull(),email:text('email').notNull(),
 answers:text('answers').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
 status:text('status').notNull().default('new'),nextCheckIn:text('next_check_in'),ownerNotes:text('owner_notes').notNull().default(''),version:integer('version').notNull().default(1)
},t=>[index('idx_career_records_created_at').on(t.createdAt)]);
export const notifications=sqliteTable('career_notifications',{
 recordId:text('record_id').primaryKey().references(()=>careerRecords.id),state:text('state').notNull().default('pending'),
 attempts:integer('attempts').notNull().default(0),firstAttemptAt:text('first_attempt_at'),lastAttemptAt:text('last_attempt_at'),
 providerId:text('provider_id'),error:text('error')
});
export const limits=sqliteTable('career_submission_limits',{
 key:text('key').primaryKey(),count:integer('count').notNull().default(0),expiresAt:text('expires_at').notNull()
});

export const resourceSubscribers=sqliteTable('resource_subscribers',{
 email:text('email').primaryKey(),name:text('name').notNull().default(''),status:text('status').notNull().default('pending'),
 createdAt:text('created_at').notNull(),consentAt:text('consent_at').notNull(),consentText:text('consent_text').notNull(),
 confirmationHash:text('confirmation_hash'),confirmationExpiresAt:text('confirmation_expires_at'),confirmedAt:text('confirmed_at'),
 unsubscribeToken:text('unsubscribe_token').notNull(),unsubscribedAt:text('unsubscribed_at'),lastRequestedAt:text('last_requested_at').notNull(),
 sendWindowStart:text('send_window_start').notNull(),sendCount:integer('send_count').notNull().default(0),emailState:text('email_state').notNull().default('pending')
},t=>[index('idx_resource_subscribers_status_created').on(t.status,t.createdAt),index('idx_resource_subscribers_confirmation').on(t.confirmationHash),index('idx_resource_subscribers_unsubscribe').on(t.unsubscribeToken)]);
export const resourceSignupLimits=sqliteTable('resource_signup_limits',{
 key:text('key').primaryKey(),count:integer('count').notNull().default(0),expiresAt:text('expires_at').notNull()
});

export const communityContributions=sqliteTable('community_contributions',{
 id:text('id').primaryKey(),requestHash:text('request_hash').notNull(),name:text('name').notNull(),email:text('email').notNull(),kind:text('kind').notNull(),resourceUrl:text('resource_url').notNull().default(''),message:text('message').notNull(),createdAt:text('created_at').notNull(),consentText:text('consent_text').notNull(),status:text('status').notNull().default('new')
},t=>[index('idx_community_contributions_created').on(t.createdAt)]);
export const communityNotifications=sqliteTable('community_notifications',{
 recordId:text('record_id').primaryKey().references(()=>communityContributions.id),state:text('state').notNull().default('pending'),attempts:integer('attempts').notNull().default(0),firstAttemptAt:text('first_attempt_at'),lastAttemptAt:text('last_attempt_at'),providerId:text('provider_id'),error:text('error')
});
export const communityContributionLimits=sqliteTable('community_contribution_limits',{
 key:text('key').primaryKey(),count:integer('count').notNull().default(0),expiresAt:text('expires_at').notNull()
});

export const readerBookmarks=sqliteTable('reader_bookmarks',{
 userId:text('user_id').notNull(),itemId:text('item_id').notNull(),saved:integer('saved').notNull(),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.itemId]})]);

export const readerLearningActivity=sqliteTable('reader_learning_activity',{
 userId:text('user_id').notNull(),activityKey:text('activity_key').notNull(),
 day:text('day').notNull(),lessonId:text('lesson_id').notNull(),
 review:integer('review').notNull(),perfect:integer('perfect').notNull()
},t=>[primaryKey({columns:[t.userId,t.activityKey]})]);
