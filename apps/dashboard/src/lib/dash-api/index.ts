/**
 * 🌐 Dash API — Central Export Hub
 * src/lib/dash-api/index.ts
 *
 * Unified boundary interface for Dash frontend application.
 * Zero database imports, zero internal schema coupling.
 */

import { dashJourneysApi, DashApiJourneysClient } from './journeys';
import { dashAddonsApi, DashApiAddonsClient } from './addons';
import { dashPoliciesApi, DashApiPoliciesClient } from './policies';
import { dashKnowledgeApi, DashApiKnowledgeClient } from './knowledge';
import { dashConversationsApi, DashApiConversationsClient } from './conversations';
import { dashOverviewApi, DashApiOverviewClient } from './overview';
import { dashChannelsApi, DashApiChannelsClient } from './channels';
import { dashActivityApi, DashApiActivityClient } from './activity';
import { dashSettingsApi, DashApiSettingsClient } from './settings';
import { dashIdentityApi, DashApiIdentityClient } from './identity';
import { dashControlPlaneApi, DashApiControlPlaneClient } from './control-plane';

export const DashApi = {
  journeys: dashJourneysApi,
  addons: dashAddonsApi,
  policies: dashPoliciesApi,
  knowledge: dashKnowledgeApi,
  conversations: dashConversationsApi,
  overview: dashOverviewApi,
  channels: dashChannelsApi,
  activity: dashActivityApi,
  settings: dashSettingsApi,
  identity: dashIdentityApi,
  controlPlane: dashControlPlaneApi,
};

export {
  DashApiJourneysClient,
  DashApiAddonsClient,
  DashApiPoliciesClient,
  DashApiKnowledgeClient,
  DashApiConversationsClient,
  DashApiOverviewClient,
  DashApiChannelsClient,
  DashApiActivityClient,
  DashApiSettingsClient,
  DashApiIdentityClient,
  DashApiControlPlaneClient,
};
