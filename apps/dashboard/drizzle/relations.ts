import { relations } from "drizzle-orm/relations";
import { whatsappUsers, whatsappSessions, whatsappMessages } from "./schema";

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