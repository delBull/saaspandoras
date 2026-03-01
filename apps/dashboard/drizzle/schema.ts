import { pgTable, unique, serial, varchar, text, integer, jsonb, boolean, timestamp, foreignKey, numeric, uuid, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const achievementType = pgEnum("achievement_type", ['first_steps', 'investor', 'community_builder', 'tokenization_expert', 'early_adopter', 'high_roller', 'creator', 'dao_pioneer', 'artifact_collector', 'defi_starter', 'governor', 'yield_hunter', 'explorer'])
export const auditActorType = pgEnum("audit_actor_type", ['integration', 'admin', 'system'])
export const bookingStatus = pgEnum("booking_status", ['pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled'])
export const businessCategory = pgEnum("business_category", ['residential_real_estate', 'commercial_real_estate', 'tech_startup', 'renewable_energy', 'art_collectibles', 'intellectual_property', 'defi', 'gaming', 'metaverse', 'music_audio', 'sports_fan_tokens', 'education', 'healthcare', 'supply_chain', 'infrastructure', 'social_networks', 'carbon_credits', 'insurance', 'prediction_markets', 'other'])
export const clientStatus = pgEnum("client_status", ['lead', 'negotiating', 'closed_won', 'closed_lost', 'churned'])
export const daoActivityStatus = pgEnum("dao_activity_status", ['active', 'paused', 'ended'])
export const daoActivitySubmissionStatus = pgEnum("dao_activity_submission_status", ['pending', 'approved', 'rejected'])
export const daoActivityType = pgEnum("dao_activity_type", ['social', 'on_chain', 'content', 'custom'])
export const eventCategory = pgEnum("event_category", ['projects', 'investments', 'community', 'learning', 'daily', 'special'])
export const eventType = pgEnum("event_type", ['project_application_submitted', 'project_application_approved', 'protocol_deployed', 'sale_certified', 'investment_made', 'user_registered', 'daily_login', 'referral_made', 'profile_completed', 'community_post', 'course_started', 'course_completed', 'quiz_passed', 'streak_milestone', 'beta_access', 'feature_unlock', 'milestone_reached', 'dao_activated', 'artifact_purchased', 'staking_deposit', 'proposal_vote', 'rewards_claimed', 'activity_completed', 'forum_post', 'access_card_acquired', 'artifact_acquired'])
export const executionStatus = pgEnum("execution_status", ['active', 'paused', 'completed', 'intercepted', 'failed'])
export const governanceEventStatus = pgEnum("governance_event_status", ['scheduled', 'active', 'completed', 'cancelled'])
export const governanceEventType = pgEnum("governance_event_type", ['on_chain_proposal', 'off_chain_signal', 'meeting', 'update'])
export const integrationEnvironment = pgEnum("integration_environment", ['staging', 'production'])
export const integrationPermission = pgEnum("integration_permission", ['deploy', 'read', 'governance', 'treasury'])
export const paymentMethod = pgEnum("payment_method", ['stripe', 'crypto', 'wire'])
export const pointsCategory = pgEnum("points_category", ['project_application', 'investment', 'daily_login', 'community', 'special_event'])
export const projectStatus = pgEnum("project_status", ['draft', 'pending', 'active_client', 'approved', 'live', 'completed', 'incomplete', 'rejected'])
export const referralSource = pgEnum("referral_source", ['direct', 'link', 'code', 'social'])
export const referralStatus = pgEnum("referral_status", ['pending', 'completed', 'expired'])
export const rewardType = pgEnum("reward_type", ['token_discount', 'badge', 'priority_access', 'bonus_points', 'nft'])
export const shortlinkType = pgEnum("shortlink_type", ['redirect', 'landing'])
export const tokenType = pgEnum("token_type", ['erc20', 'erc721', 'erc1155'])
export const transactionStatus = pgEnum("transaction_status", ['pending', 'processing', 'completed', 'failed', 'refunded', 'rejected'])
export const triggerType = pgEnum("trigger_type", ['manual', 'auto_registration', 'api_event'])
export const webhookStatus = pgEnum("webhook_status", ['pending', 'sent', 'failed'])
export const yieldSource = pgEnum("yield_source", ['rental_income', 'capital_appreciation', 'dividends', 'royalties', 'other'])


export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	icon: varchar({ length: 10 }).notNull(),
	type: achievementType().notNull(),
	requiredPoints: integer("required_points").default(0).notNull(),
	requiredLevel: integer("required_level").default(1).notNull(),
	requiredEvents: jsonb("required_events"),
	pointsReward: integer("points_reward").default(0).notNull(),
	badgeUrl: text("badge_url"),
	isActive: boolean("is_active").default(true).notNull(),
	isSecret: boolean("is_secret").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	code: varchar({ length: 50 }),
}, (table) => [
	unique("achievements_code_unique").on(table.code),
]);

export const administrators = pgTable("administrators", {
	id: serial().primaryKey().notNull(),
	walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
	alias: varchar({ length: 100 }),
	role: varchar({ length: 50 }).default('admin').notNull(),
	addedBy: varchar("added_by", { length: 42 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	availability: jsonb(),
}, (table) => [
	unique("administrators_wallet_address_unique").on(table.walletAddress),
]);

export const auditLogs = pgTable("audit_logs", {
	id: serial().primaryKey().notNull(),
	actorType: auditActorType("actor_type").notNull(),
	actorId: varchar("actor_id", { length: 255 }).notNull(),
	action: varchar({ length: 255 }).notNull(),
	resource: varchar({ length: 255 }).notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const daoActivitySubmissions = pgTable("dao_activity_submissions", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id"),
	activityId: integer("activity_id").notNull(),
	userWallet: varchar("user_wallet", { length: 42 }).notNull(),
	proofData: text("proof_data"),
	status: daoActivitySubmissionStatus().default('pending').notNull(),
	feedback: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true, mode: 'string' }),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [daoActivities.id],
			name: "dao_activity_submissions_activity_id_dao_activities_id_fk"
		}),
]);

export const daoThreads = pgTable("dao_threads", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	authorAddress: varchar("author_address", { length: 42 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 50 }).default('general'),
	isOfficial: boolean("is_official").default(false),
	isPinned: boolean("is_pinned").default(false),
	isLocked: boolean("is_locked").default(false),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const clients = pgTable("clients", {
	id: text().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	name: varchar({ length: 255 }),
	walletAddress: varchar("wallet_address", { length: 42 }),
	source: varchar({ length: 50 }).default('manual'),
	package: varchar({ length: 50 }),
	status: clientStatus().default('lead').notNull(),
	metadata: jsonb().default({}),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const daoActivities = pgTable("dao_activities", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	rewardAmount: numeric("reward_amount", { precision: 18, scale:  6 }).default('0').notNull(),
	rewardTokenSymbol: varchar("reward_token_symbol", { length: 20 }).default('PBOX').notNull(),
	category: varchar({ length: 50 }).default('social'),
	requirements: jsonb().default({}),
	type: daoActivityType().default('custom').notNull(),
	status: daoActivityStatus().default('active').notNull(),
	externalLink: text("external_link"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "dao_activities_project_id_projects_id_fk"
		}),
]);

export const emailMetrics = pgTable("email_metrics", {
	id: serial().primaryKey().notNull(),
	emailId: varchar("email_id", { length: 255 }).notNull(),
	type: varchar({ length: 50 }).default('unknown').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	recipient: varchar({ length: 255 }),
	emailSubject: text("email_subject"),
	clickedUrl: text("clicked_url"),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	openedAt: timestamp("opened_at", { withTimezone: true, mode: 'string' }),
	clickedAt: timestamp("clicked_at", { withTimezone: true, mode: 'string' }),
	bouncedAt: timestamp("bounced_at", { withTimezone: true, mode: 'string' }),
	complaintAt: timestamp("complaint_at", { withTimezone: true, mode: 'string' }),
	userAgent: text("user_agent"),
	ipAddress: varchar("ip_address", { length: 45 }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("email_metrics_email_id_unique").on(table.emailId),
]);

export const governanceEvents = pgTable("governance_events", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	type: governanceEventType().default('on_chain_proposal').notNull(),
	status: governanceEventStatus().default('scheduled').notNull(),
	externalLink: text("external_link"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "governance_events_project_id_projects_id_fk"
		}),
]);

export const gamificationEvents = pgTable("gamification_events", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	type: eventType().notNull(),
	category: eventCategory().notNull(),
	points: integer().default(0).notNull(),
	projectId: integer("project_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "gamification_events_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "gamification_events_project_id_projects_id_fk"
		}),
]);

export const integrationClients = pgTable("integration_clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	environment: integrationEnvironment().default('staging').notNull(),
	apiKeyHash: text("api_key_hash").notNull(),
	keyFingerprint: varchar("key_fingerprint", { length: 255 }).notNull(),
	callbackUrl: text("callback_url"),
	callbackSecretHash: text("callback_secret_hash"),
	permissions: jsonb().default([]).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const paymentLinks = pgTable("payment_links", {
	id: text().primaryKey().notNull(),
	clientId: text("client_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	amount: numeric({ precision: 18, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('USD').notNull(),
	methods: jsonb().default(["stripe","crypto","wire"]).notNull(),
	destinationWallet: varchar("destination_wallet", { length: 42 }),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdBy: varchar("created_by", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "payment_links_client_id_clients_id_fk"
		}),
]);

export const schedulingBookings = pgTable("scheduling_bookings", {
	id: text().primaryKey().notNull(),
	slotId: text("slot_id").notNull(),
	leadName: text("lead_name").notNull(),
	leadEmail: text("lead_email").notNull(),
	leadPhone: text("lead_phone"),
	notificationPreference: varchar("notification_preference", { length: 20 }).default('email').notNull(),
	status: bookingStatus().default('pending').notNull(),
	meetingLink: text("meeting_link"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	cancellationReason: text("cancellation_reason"),
}, (table) => [
	foreignKey({
			columns: [table.slotId],
			foreignColumns: [schedulingSlots.id],
			name: "scheduling_bookings_slot_id_scheduling_slots_id_fk"
		}),
]);

export const platformSettings = pgTable("platform_settings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text(),
	description: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: varchar("updated_by", { length: 42 }),
}, (table) => [
	unique("platform_settings_key_unique").on(table.key),
]);

export const marketingCampaigns = pgTable("marketing_campaigns", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	triggerType: triggerType("trigger_type").default('manual').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	config: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	icon: varchar({ length: 10 }).notNull(),
	type: rewardType().notNull(),
	requiredPoints: integer("required_points").default(0).notNull(),
	requiredLevel: integer("required_level").default(1).notNull(),
	value: varchar({ length: 100 }).notNull(),
	metadata: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	stock: integer(),
	claimedCount: integer("claimed_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const shortlinks = pgTable("shortlinks", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	destinationUrl: text("destination_url").notNull(),
	title: varchar({ length: 255 }),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: varchar("created_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	type: shortlinkType().default('redirect').notNull(),
	landingConfig: jsonb("landing_config"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.walletAddress],
			name: "shortlinks_created_by_users_walletAddress_fk"
		}),
	unique("shortlinks_slug_unique").on(table.slug),
]);

export const shortlinkEvents = pgTable("shortlink_events", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 50 }).notNull(),
	domain: varchar({ length: 100 }),
	ip: varchar({ length: 45 }),
	userAgent: text("user_agent"),
	referer: text(),
	utmSource: varchar("utm_source", { length: 100 }),
	utmMedium: varchar("utm_medium", { length: 100 }),
	utmCampaign: varchar("utm_campaign", { length: 100 }),
	utmTerm: varchar("utm_term", { length: 100 }),
	utmContent: varchar("utm_content", { length: 100 }),
	deviceType: varchar("device_type", { length: 50 }),
	browser: varchar({ length: 100 }),
	country: varchar({ length: 10 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
	id: text().primaryKey().notNull(),
	linkId: text("link_id"),
	clientId: text("client_id"),
	amount: numeric({ precision: 18, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('USD').notNull(),
	method: paymentMethod().notNull(),
	status: transactionStatus().default('pending').notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.linkId],
			foreignColumns: [paymentLinks.id],
			name: "transactions_link_id_payment_links_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "transactions_client_id_clients_id_fk"
		}),
]);

export const sowTemplates = pgTable("sow_templates", {
	id: text().primaryKey().notNull(),
	tier: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	variables: jsonb().default([]),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	achievementId: integer("achievement_id").notNull(),
	progress: integer().default(0).notNull(),
	isUnlocked: boolean("is_unlocked").default(false).notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unique_user_achievement").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.achievementId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_achievements_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "user_achievements_achievement_id_achievements_id_fk"
		}),
]);

export const userBalances = pgTable("user_balances", {
	walletAddress: varchar("wallet_address", { length: 42 }).primaryKey().notNull(),
	pboxBalance: numeric("pbox_balance", { precision: 18, scale:  2 }).default('0').notNull(),
	usdcBalance: numeric("usdc_balance", { precision: 18, scale:  6 }).default('0').notNull(),
	ethBalance: numeric("eth_balance", { precision: 18, scale:  18 }).default('0').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userReferrals = pgTable("user_referrals", {
	id: serial().primaryKey().notNull(),
	referrerWalletAddress: varchar("referrer_wallet_address", { length: 42 }).notNull(),
	referredWalletAddress: varchar("referred_wallet_address", { length: 42 }).notNull(),
	referralSource: referralSource("referral_source").default('direct'),
	status: referralStatus().default('pending'),
	referrerPointsAwarded: boolean("referrer_points_awarded").default(false),
	referredPointsAwarded: boolean("referred_points_awarded").default(false),
	referredCompletedOnboarding: boolean("referred_completed_onboarding").default(false),
	referredFirstProject: boolean("referred_first_project").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	referrerBonusDate: timestamp("referrer_bonus_date", { mode: 'string' }),
	referredBonusDate: timestamp("referred_bonus_date", { mode: 'string' }),
}, (table) => [
	uniqueIndex("unique_user_referral").using("btree", table.referrerWalletAddress.asc().nullsLast().op("text_ops"), table.referredWalletAddress.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	image: text(),
	walletAddress: varchar({ length: 42 }),
	hasPandorasKey: boolean().default(false).notNull(),
	kycLevel: varchar({ length: 20 }).default('basic').notNull(),
	kycCompleted: boolean().default(false).notNull(),
	kycData: jsonb(),
	connectionCount: integer().default(1).notNull(),
	lastConnectionAt: timestamp({ mode: 'string' }).defaultNow(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	telegramId: varchar("telegram_id", { length: 255 }),
	status: varchar({ length: 20 }).default('ACTIVE').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_walletAddress_unique").on(table.walletAddress),
	unique("users_telegram_id_unique").on(table.telegramId),
]);

export const userRewards = pgTable("user_rewards", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	rewardId: integer("reward_id").notNull(),
	isClaimed: boolean("is_claimed").default(false).notNull(),
	claimedAt: timestamp("claimed_at", { mode: 'string' }),
	claimTransactionId: varchar("claim_transaction_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_rewards_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.rewardId],
			foreignColumns: [rewards.id],
			name: "user_rewards_reward_id_rewards_id_fk"
		}),
]);

export const whatsappApplicationStates = pgTable("whatsapp_application_states", {
	id: serial().primaryKey().notNull(),
	userPhone: varchar("user_phone", { length: 20 }).notNull(),
	wallet: varchar({ length: 42 }),
	currentStep: integer("current_step").default(0).notNull(),
	answers: jsonb().default({}).notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("whatsapp_application_states_user_phone_unique").on(table.userPhone),
]);

export const whatsappPreapplyLeads = pgTable("whatsapp_preapply_leads", {
	id: serial().primaryKey().notNull(),
	userPhone: varchar("user_phone", { length: 20 }).notNull(),
	step: integer().default(0).notNull(),
	status: varchar({ length: 20 }).default('in_progress').notNull(),
	answers: jsonb().default({}).notNull(),
	applicantName: varchar("applicant_name", { length: 256 }),
	applicantEmail: varchar("applicant_email", { length: 256 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unique_whatsapp_lead_phone").using("btree", table.userPhone.asc().nullsLast().op("text_ops")),
]);

export const marketingExecutions = pgTable("marketing_executions", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	leadId: varchar("lead_id", { length: 36 }),
	campaignId: integer("campaign_id").notNull(),
	status: executionStatus().default('active').notNull(),
	currentStageIndex: integer("current_stage_index").default(0).notNull(),
	nextRunAt: timestamp("next_run_at", { mode: 'string' }),
	data: jsonb().default({}).notNull(),
	history: jsonb().default([]).notNull(),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [marketingCampaigns.id],
			name: "marketing_executions_campaign_id_marketing_campaigns_id_fk"
		}),
]);

export const daoPosts = pgTable("dao_posts", {
	id: serial().primaryKey().notNull(),
	threadId: integer("thread_id").notNull(),
	authorAddress: varchar("author_address", { length: 42 }).notNull(),
	content: text().notNull(),
	isSolution: boolean("is_solution").default(false),
	likesCount: integer("likes_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [daoThreads.id],
			name: "dao_posts_thread_id_dao_threads_id_fk"
		}).onDelete("cascade"),
]);

export const schedulingSlots = pgTable("scheduling_slots", {
	id: text().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	isBooked: boolean("is_booked").default(false).notNull(),
	type: varchar({ length: 50 }).default('30_min').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "scheduling_slots_user_id_users_id_fk"
		}),
]);

export const userPoints = pgTable("user_points", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	points: integer().notNull(),
	reason: text().notNull(),
	category: pointsCategory().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_points_user_id_users_id_fk"
		}),
]);

export const webhookEvents = pgTable("webhook_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	event: varchar({ length: 255 }).notNull(),
	payload: jsonb().notNull(),
	status: webhookStatus().default('pending').notNull(),
	attempts: integer().default(0).notNull(),
	nextRetryAt: timestamp("next_retry_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [integrationClients.id],
			name: "webhook_events_client_id_integration_clients_id_fk"
		}),
]);

export const whatsappSessions = pgTable("whatsapp_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	flowType: text("flow_type").notNull(),
	state: jsonb().default({}).notNull(),
	currentStep: integer("current_step").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [whatsappUsers.id],
			name: "whatsapp_sessions_user_id_whatsapp_users_id_fk"
		}),
]);

export const whatsappMessages = pgTable("whatsapp_messages", {
	id: text().primaryKey().notNull(),
	sessionId: text("session_id"),
	direction: text().notNull(),
	body: text(),
	messageType: text("message_type").default('text').notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [whatsappSessions.id],
			name: "whatsapp_messages_session_id_whatsapp_sessions_id_fk"
		}),
]);

export const whatsappUsers = pgTable("whatsapp_users", {
	id: text().primaryKey().notNull(),
	phone: text().notNull(),
	name: text(),
	priorityLevel: text("priority_level").default('normal').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("whatsapp_users_phone_unique").on(table.phone),
]);

export const governanceVotes = pgTable("governance_votes", {
	id: serial().primaryKey().notNull(),
	proposalId: integer("proposal_id").notNull(),
	voterAddress: text("voter_address").notNull(),
	support: integer().notNull(),
	signature: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("unique_vote").using("btree", table.proposalId.asc().nullsLast().op("int4_ops"), table.voterAddress.asc().nullsLast().op("int4_ops")),
]);

export const gamificationProfiles = pgTable("gamification_profiles", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
	totalPoints: integer("total_points").default(0).notNull(),
	currentLevel: integer("current_level").default(1).notNull(),
	levelProgress: integer("level_progress").default(0).notNull(),
	pointsToNextLevel: integer("points_to_next_level").default(100).notNull(),
	projectsApplied: integer("projects_applied").default(0).notNull(),
	projectsApproved: integer("projects_approved").default(0).notNull(),
	totalInvested: numeric("total_invested", { precision: 18, scale:  2 }).default('0.00').notNull(),
	communityContributions: integer("community_contributions").default(0).notNull(),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	totalActiveDays: integer("total_active_days").default(0).notNull(),
	referralsCount: integer("referrals_count").default(0).notNull(),
	communityRank: integer("community_rank").default(0).notNull(),
	reputationScore: integer("reputation_score").default(0).notNull(),
	lastActivityDate: timestamp("last_activity_date", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	claimedPoints: integer("claimed_points").default(0).notNull(),
	lastClaimedAt: timestamp("last_claimed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "gamification_profiles_user_id_users_id_fk"
		}),
	unique("gamification_profiles_user_id_unique").on(table.userId),
]);

export const accountRecoveryTokens = pgTable("account_recovery_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	scope: varchar({ length: 20 }).default('recovery').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "account_recovery_tokens_user_id_users_id_fk"
		}),
]);

export const pboxClaims = pgTable("pbox_claims", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
	amount: integer().notNull(),
	status: varchar({ length: 20 }).default('PENDING').notNull(),
	txHash: varchar("tx_hash", { length: 66 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "pbox_claims_user_id_users_id_fk"
		}),
]);

export const securityEvents = pgTable("security_events", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	type: varchar({ length: 50 }).notNull(),
	metadata: jsonb(),
	ip: varchar({ length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "security_events_user_id_users_id_fk"
		}),
]);

export const authChallenges = pgTable("auth_challenges", {
	id: serial().primaryKey().notNull(),
	address: varchar({ length: 42 }).notNull(),
	nonce: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("auth_challenges_address_idx").using("btree", table.address.asc().nullsLast().op("text_ops")),
	unique("auth_challenges_nonce_unique").on(table.nonce),
]);

export const gamificationActionExecutions = pgTable("gamification_action_executions", {
	eventId: text("event_id").notNull(),
	triggerId: text("trigger_id").notNull(),
	actionType: text("action_type").notNull(),
	userId: text("user_id").notNull(),
	executedAt: timestamp("executed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const pboxBalances = pgTable("pbox_balances", {
	walletAddress: text("wallet_address").primaryKey().notNull(),
	totalEarned: integer("total_earned").default(0).notNull(),
	reserved: integer().default(0).notNull(),
	claimed: integer().default(0).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	scope: varchar({ length: 20 }).notNull(),
	ip: varchar({ length: 45 }),
	userAgent: text("user_agent"),
	issuedAt: timestamp("issued_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	revokedReason: varchar("revoked_reason", { length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}),
]);

export const projects = pgTable("projects", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 256 }).notNull(),
	slug: varchar({ length: 256 }).notNull(),
	logoUrl: text("logo_url"),
	coverPhotoUrl: text("cover_photo_url"),
	tagline: varchar({ length: 140 }),
	description: text().notNull(),
	businessCategory: businessCategory("business_category").default('other'),
	videoPitch: varchar("video_pitch", { length: 512 }),
	website: varchar({ length: 512 }),
	whitepaperUrl: varchar("whitepaper_url", { length: 512 }),
	twitterUrl: varchar("twitter_url", { length: 512 }),
	discordUrl: varchar("discord_url", { length: 512 }),
	telegramUrl: varchar("telegram_url", { length: 512 }),
	linkedinUrl: varchar("linkedin_url", { length: 512 }),
	targetAmount: numeric("target_amount", { precision: 18, scale:  2 }).default('0.00').notNull(),
	totalValuationUsd: numeric("total_valuation_usd", { precision: 18, scale:  2 }),
	tokenType: tokenType("token_type").default('erc20'),
	totalTokens: integer("total_tokens"),
	tokensOffered: integer("tokens_offered"),
	tokenPriceUsd: numeric("token_price_usd", { precision: 18, scale:  6 }),
	estimatedApy: varchar("estimated_apy", { length: 50 }),
	yieldSource: yieldSource("yield_source").default('other'),
	lockupPeriod: varchar("lockup_period", { length: 100 }),
	fundUsage: text("fund_usage"),
	recurringRewards: text("recurring_rewards"),
	stakingRewardsEnabled: boolean("staking_rewards_enabled").default(false),
	stakingRewardsDetails: text("staking_rewards_details"),
	revenueSharingEnabled: boolean("revenue_sharing_enabled").default(false),
	revenueSharingDetails: text("revenue_sharing_details"),
	workToEarnEnabled: boolean("work_to_earn_enabled").default(false),
	workToEarnDetails: text("work_to_earn_details"),
	tieredAccessEnabled: boolean("tiered_access_enabled").default(false),
	tieredAccessDetails: text("tiered_access_details"),
	discountedFeesEnabled: boolean("discounted_fees_enabled").default(false),
	discountedFeesDetails: text("discounted_fees_details"),
	teamMembers: jsonb("team_members"),
	advisors: jsonb(),
	tokenDistribution: jsonb("token_distribution"),
	contractAddress: varchar("contract_address", { length: 42 }),
	treasuryAddress: varchar("treasury_address", { length: 42 }),
	licenseContractAddress: varchar("license_contract_address", { length: 42 }),
	utilityContractAddress: varchar("utility_contract_address", { length: 42 }),
	loomContractAddress: varchar("loom_contract_address", { length: 42 }),
	governorContractAddress: varchar("governor_contract_address", { length: 42 }),
	chainId: integer("chain_id"),
	deploymentStatus: varchar("deployment_status", { length: 50 }).default('pending'),
	w2EConfig: jsonb("w2e_config").default({}),
	legalStatus: text("legal_status"),
	valuationDocumentUrl: text("valuation_document_url"),
	fiduciaryEntity: varchar("fiduciary_entity", { length: 256 }),
	dueDiligenceReportUrl: text("due_diligence_report_url"),
	isMintable: boolean("is_mintable").default(false),
	isMutable: boolean("is_mutable").default(false),
	updateAuthorityAddress: varchar("update_authority_address", { length: 42 }),
	applicantName: varchar("applicant_name", { length: 256 }),
	applicantPosition: varchar("applicant_position", { length: 256 }),
	applicantEmail: varchar("applicant_email", { length: 256 }),
	applicantPhone: varchar("applicant_phone", { length: 50 }),
	applicantWalletAddress: varchar("applicant_wallet_address", { length: 42 }),
	verificationAgreement: boolean("verification_agreement").default(false),
	integrationDetails: text("integration_details"),
	legalEntityHelp: boolean("legal_entity_help").default(false),
	imageUrl: text("image_url"),
	socials: jsonb(),
	raisedAmount: numeric("raised_amount", { precision: 18, scale:  2 }).default('0.00'),
	returnsPaid: numeric("returns_paid", { precision: 18, scale:  2 }).default('0.00'),
	votingContractAddress: varchar("voting_contract_address", { length: 42 }),
	status: projectStatus().default('draft').notNull(),
	featured: boolean().default(false).notNull(),
	featuredButtonText: varchar("featured_button_text", { length: 100 }).default('Dime más'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	protocolVersion: integer("protocol_version").default(1),
	registryContractAddress: varchar("registry_contract_address", { length: 42 }),
	artifacts: jsonb().default([]),
	pageLayoutType: varchar("page_layout_type", { length: 50 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	accessType: varchar("access_type", { length: 20 }).default('free'),
	price: numeric({ precision: 18, scale:  6 }).default('0.000000'),
}, (table) => [
	unique("projects_slug_unique").on(table.slug),
]);

export const telegramBindings = pgTable("telegram_bindings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	telegramUserId: text("telegram_user_id").notNull(),
	walletAddress: text("wallet_address").notNull(),
	source: text().default('telegram').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("telegram_bindings_telegram_user_id_unique").on(table.telegramUserId),
]);
