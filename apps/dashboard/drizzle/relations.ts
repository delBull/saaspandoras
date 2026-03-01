import { relations } from "drizzle-orm/relations";
import { daoActivities, daoActivitySubmissions, projects, governanceEvents, users, gamificationEvents, clients, paymentLinks, schedulingSlots, schedulingBookings, shortlinks, transactions, userAchievements, achievements, userRewards, rewards, marketingCampaigns, marketingExecutions, daoThreads, daoPosts, userPoints, integrationClients, webhookEvents, whatsappUsers, whatsappSessions, whatsappMessages, gamificationProfiles, accountRecoveryTokens, pboxClaims, securityEvents, sessions } from "./schema";

export const daoActivitySubmissionsRelations = relations(daoActivitySubmissions, ({one}) => ({
	daoActivity: one(daoActivities, {
		fields: [daoActivitySubmissions.activityId],
		references: [daoActivities.id]
	}),
}));

export const daoActivitiesRelations = relations(daoActivities, ({one, many}) => ({
	daoActivitySubmissions: many(daoActivitySubmissions),
	project: one(projects, {
		fields: [daoActivities.projectId],
		references: [projects.id]
	}),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	daoActivities: many(daoActivities),
	governanceEvents: many(governanceEvents),
	gamificationEvents: many(gamificationEvents),
}));

export const governanceEventsRelations = relations(governanceEvents, ({one}) => ({
	project: one(projects, {
		fields: [governanceEvents.projectId],
		references: [projects.id]
	}),
}));

export const gamificationEventsRelations = relations(gamificationEvents, ({one}) => ({
	user: one(users, {
		fields: [gamificationEvents.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [gamificationEvents.projectId],
		references: [projects.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	gamificationEvents: many(gamificationEvents),
	shortlinks: many(shortlinks),
	userAchievements: many(userAchievements),
	userRewards: many(userRewards),
	schedulingSlots: many(schedulingSlots),
	userPoints: many(userPoints),
	gamificationProfiles: many(gamificationProfiles),
	accountRecoveryTokens: many(accountRecoveryTokens),
	pboxClaims: many(pboxClaims),
	securityEvents: many(securityEvents),
	sessions: many(sessions),
}));

export const paymentLinksRelations = relations(paymentLinks, ({one, many}) => ({
	client: one(clients, {
		fields: [paymentLinks.clientId],
		references: [clients.id]
	}),
	transactions: many(transactions),
}));

export const clientsRelations = relations(clients, ({many}) => ({
	paymentLinks: many(paymentLinks),
	transactions: many(transactions),
}));

export const schedulingBookingsRelations = relations(schedulingBookings, ({one}) => ({
	schedulingSlot: one(schedulingSlots, {
		fields: [schedulingBookings.slotId],
		references: [schedulingSlots.id]
	}),
}));

export const schedulingSlotsRelations = relations(schedulingSlots, ({one, many}) => ({
	schedulingBookings: many(schedulingBookings),
	user: one(users, {
		fields: [schedulingSlots.userId],
		references: [users.id]
	}),
}));

export const shortlinksRelations = relations(shortlinks, ({one}) => ({
	user: one(users, {
		fields: [shortlinks.createdBy],
		references: [users.walletAddress]
	}),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	paymentLink: one(paymentLinks, {
		fields: [transactions.linkId],
		references: [paymentLinks.id]
	}),
	client: one(clients, {
		fields: [transactions.clientId],
		references: [clients.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const userRewardsRelations = relations(userRewards, ({one}) => ({
	user: one(users, {
		fields: [userRewards.userId],
		references: [users.id]
	}),
	reward: one(rewards, {
		fields: [userRewards.rewardId],
		references: [rewards.id]
	}),
}));

export const rewardsRelations = relations(rewards, ({many}) => ({
	userRewards: many(userRewards),
}));

export const marketingExecutionsRelations = relations(marketingExecutions, ({one}) => ({
	marketingCampaign: one(marketingCampaigns, {
		fields: [marketingExecutions.campaignId],
		references: [marketingCampaigns.id]
	}),
}));

export const marketingCampaignsRelations = relations(marketingCampaigns, ({many}) => ({
	marketingExecutions: many(marketingExecutions),
}));

export const daoPostsRelations = relations(daoPosts, ({one}) => ({
	daoThread: one(daoThreads, {
		fields: [daoPosts.threadId],
		references: [daoThreads.id]
	}),
}));

export const daoThreadsRelations = relations(daoThreads, ({many}) => ({
	daoPosts: many(daoPosts),
}));

export const userPointsRelations = relations(userPoints, ({one}) => ({
	user: one(users, {
		fields: [userPoints.userId],
		references: [users.id]
	}),
}));

export const webhookEventsRelations = relations(webhookEvents, ({one}) => ({
	integrationClient: one(integrationClients, {
		fields: [webhookEvents.clientId],
		references: [integrationClients.id]
	}),
}));

export const integrationClientsRelations = relations(integrationClients, ({many}) => ({
	webhookEvents: many(webhookEvents),
}));

export const whatsappSessionsRelations = relations(whatsappSessions, ({one, many}) => ({
	whatsappUser: one(whatsappUsers, {
		fields: [whatsappSessions.userId],
		references: [whatsappUsers.id]
	}),
	whatsappMessages: many(whatsappMessages),
}));

export const whatsappUsersRelations = relations(whatsappUsers, ({many}) => ({
	whatsappSessions: many(whatsappSessions),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({one}) => ({
	whatsappSession: one(whatsappSessions, {
		fields: [whatsappMessages.sessionId],
		references: [whatsappSessions.id]
	}),
}));

export const gamificationProfilesRelations = relations(gamificationProfiles, ({one}) => ({
	user: one(users, {
		fields: [gamificationProfiles.userId],
		references: [users.id]
	}),
}));

export const accountRecoveryTokensRelations = relations(accountRecoveryTokens, ({one}) => ({
	user: one(users, {
		fields: [accountRecoveryTokens.userId],
		references: [users.id]
	}),
}));

export const pboxClaimsRelations = relations(pboxClaims, ({one}) => ({
	user: one(users, {
		fields: [pboxClaims.userId],
		references: [users.id]
	}),
}));

export const securityEventsRelations = relations(securityEvents, ({one}) => ({
	user: one(users, {
		fields: [securityEvents.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));