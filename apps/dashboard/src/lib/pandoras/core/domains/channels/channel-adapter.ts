import { ChannelType, ChannelInboundMessage, ChannelOutboundMessage, ChannelDeliveryResult } from './channel-types';
import { NormalizedInboundMessage } from './normalized-message';
import { ControlPlaneContext } from '../control-plane/application/context';

export interface ChannelAdapter {
  readonly channelType: ChannelType;

  receive(
    input: ChannelInboundMessage,
    context?: ControlPlaneContext
  ): Promise<NormalizedInboundMessage>;

  send(
    input: ChannelOutboundMessage
  ): Promise<ChannelDeliveryResult>;
}
