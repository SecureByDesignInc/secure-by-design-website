import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
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

// Course guide notes, checks, answers and completed lessons (migration 0018).
export const readerGuideState=sqliteTable('reader_guide_state',{
 userId:text('user_id').notNull(),guideId:text('guide_id').notNull(),state:text('state').notNull(),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.guideId]})]);
export const readerBookmarks=sqliteTable('reader_bookmarks',{
 userId:text('user_id').notNull(),itemId:text('item_id').notNull(),saved:integer('saved').notNull(),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.itemId]})]);

export const readerLearningActivity=sqliteTable('reader_learning_activity',{
 userId:text('user_id').notNull(),activityKey:text('activity_key').notNull(),
 day:text('day').notNull(),lessonId:text('lesson_id').notNull(),
 review:integer('review').notNull(),perfect:integer('perfect').notNull()
},t=>[primaryKey({columns:[t.userId,t.activityKey]})]);

// Sign-in methods (0011): provider identities, passkeys, and short-lived sign-in flows.
export const readerIdentities=sqliteTable('reader_identities',{
 provider:text('provider').notNull(),subject:text('subject').notNull(),accountId:text('account_id').notNull().references(()=>readerAccounts.id,{onDelete:'cascade'}),
 email:text('email'),refreshToken:text('refresh_token'),createdAt:text('created_at').notNull(),lastUsedAt:text('last_used_at')
},t=>[primaryKey({columns:[t.provider,t.subject]}),index('idx_reader_identities_account').on(t.accountId)]);
export const readerPasskeys=sqliteTable('reader_passkeys',{
 credentialId:text('credential_id').primaryKey(),accountId:text('account_id').notNull().references(()=>readerAccounts.id,{onDelete:'cascade'}),
 publicKey:text('public_key').notNull(),algorithm:integer('algorithm').notNull(),signCount:integer('sign_count').notNull().default(0),
 transports:text('transports'),label:text('label'),createdAt:text('created_at').notNull(),lastUsedAt:text('last_used_at')
},t=>[index('idx_reader_passkeys_account').on(t.accountId)]);
export const readerAuthFlows=sqliteTable('reader_auth_flows',{
 idHash:text('id_hash').primaryKey(),kind:text('kind').notNull(),data:text('data').notNull(),expiresAt:text('expires_at').notNull()
},t=>[index('idx_reader_auth_flows_expires').on(t.expiresAt)]);

// Authorization Workspace (0014): each learner's practice systems, controls, evidence, POA&M, packages and audit trail.
export const authSystems=sqliteTable('auth_systems',{
 id:text('id').primaryKey(),accountId:text('account_id').notNull().references(()=>readerAccounts.id,{onDelete:'cascade'}),
 profile:text('profile').notNull(),currentDecision:text('current_decision'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
 // 'sbd-enclave' for the one Secure By Design enclave an account may keep (drizzle/0015); NULL otherwise.
 registrationKey:text('registration_key')
},t=>[index('idx_auth_systems_account').on(t.accountId),uniqueIndex('uq_auth_systems_registration').on(t.accountId,t.registrationKey)]);
export const authControls=sqliteTable('auth_controls',{
 systemId:text('system_id').notNull().references(()=>authSystems.id,{onDelete:'cascade'}),controlId:text('control_id').notNull(),
 implementationStatus:text('implementation_status').notNull().default('planned'),provider:text('provider'),narrative:text('narrative').notNull().default(''),
 responsible:text('responsible').notNull().default(''),frequency:text('frequency').notNull().default('annual'),step:text('step').notNull().default('draft'),
 results:text('results').notNull().default('{}'),assessorNotes:text('assessor_notes').notNull().default(''),returnComment:text('return_comment'),
 reassessReason:text('reassess_reason'),lastAssessedAt:text('last_assessed_at'),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.systemId,t.controlId]})]);
export const authArtifacts=sqliteTable('auth_artifacts',{
 id:text('id').primaryKey(),systemId:text('system_id').notNull().references(()=>authSystems.id,{onDelete:'cascade'}),
 title:text('title').notNull(),kind:text('kind').notNull(),packageRole:text('package_role').notNull().default('none'),description:text('description').notNull().default(''),
 content:text('content').notNull().default(''),location:text('location').notNull().default(''),version:text('version').notNull().default('1.0'),artifactDate:text('artifact_date'),
 controls:text('controls').notNull().default('[]'),reviewState:text('review_state').notNull().default('draft'),reviewNote:text('review_note').notNull().default(''),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>[index('idx_auth_artifacts_system').on(t.systemId)]);
export const authPoam=sqliteTable('auth_poam',{
 id:text('id').primaryKey(),systemId:text('system_id').notNull().references(()=>authSystems.id,{onDelete:'cascade'}),number:integer('number').notNull(),
 controlId:text('control_id'),weakness:text('weakness').notNull().default(''),source:text('source').notNull().default('assessment'),severity:text('severity').notNull().default('CAT II'),
 residualRisk:text('residual_risk').notNull().default('moderate'),mitigations:text('mitigations').notNull().default(''),resources:text('resources').notNull().default(''),
 poc:text('poc').notNull().default(''),scheduledCompletion:text('scheduled_completion'),milestones:text('milestones').notNull().default('[]'),status:text('status').notNull().default('ongoing'),
 comments:text('comments').notNull().default(''),completedAt:text('completed_at'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>[uniqueIndex('idx_auth_poam_number').on(t.systemId,t.number)]);
export const authPackages=sqliteTable('auth_packages',{
 id:text('id').primaryKey(),systemId:text('system_id').notNull().references(()=>authSystems.id,{onDelete:'cascade'}),type:text('type').notNull(),
 stage:text('stage').notNull().default('draft'),executiveSummary:text('executive_summary').notNull().default(''),assessorSummary:text('assessor_summary').notNull().default(''),
 review:text('review'),decision:text('decision'),snapshot:text('snapshot'),submittedAt:text('submitted_at'),decidedAt:text('decided_at'),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>[index('idx_auth_packages_system').on(t.systemId,t.createdAt)]);
export const authHistory=sqliteTable('auth_history',{
 id:integer('id').primaryKey({autoIncrement:true}),systemId:text('system_id').notNull().references(()=>authSystems.id,{onDelete:'cascade'}),
 at:text('at').notNull(),role:text('role').notNull(),action:text('action').notNull(),subject:text('subject').notNull().default(''),detail:text('detail').notNull().default('')
},t=>[index('idx_auth_history_system').on(t.systemId,t.id)]);
// Homepage community panel (17 October 2026): names supporters chose to list after a Stripe payment, and checkout rate limits.
export const supportWall=sqliteTable('support_wall',{
 sessionId:text('session_id').primaryKey(),subscriptionId:text('subscription_id'),displayName:text('display_name').notNull(),
 monthly:integer('monthly').notNull().default(0),hidden:integer('hidden').notNull().default(0),createdAt:text('created_at').notNull()
},t=>[index('support_wall_created_idx').on(t.createdAt),index('support_wall_subscription_idx').on(t.subscriptionId)]);
export const supportCheckoutLimits=sqliteTable('support_checkout_limits',{
 key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:text('expires_at').notNull()
});
