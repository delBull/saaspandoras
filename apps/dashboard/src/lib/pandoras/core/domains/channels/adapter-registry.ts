import { ChannelType } from './channel-types';
import { ChannelAdapter } from './channel-adapter';
import { UnsupportedChannelError } from './channel-errors';

export interface ChannelAdapterRegistry {
  get(channelType: ChannelType): ChannelAdapter;
  register(adapter: ChannelAdapter): void;
}

export class DefaultChannelAdapterRegistry implements ChannelAdapterRegistry {
  private adapters = new Map<ChannelType, ChannelAdapter>();

  register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channelType, adapter);
  }

  get(channelType: ChannelType): ChannelAdapter {
    const adapter = this.adapters.get(channelType);
    if (!adapter) {
      throw new UnsupportedChannelError(`No channel adapter registered for '${channelType}'`);
    }
    return adapter;
  }
}
