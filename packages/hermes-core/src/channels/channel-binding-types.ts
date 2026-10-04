import { ChannelType } from './channel-types';

export interface OrganizationChannelBinding {
  id: string;
  organizationId: string;
  channelType: ChannelType;
  channelIdentity: string;
  credentialsRef?: string;
  status: 'ACTIVE' | 'INACTIVE';
}
