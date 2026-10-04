export class ChannelBindingNotFoundError extends Error {
  constructor(message = 'Channel binding not found') {
    super(message);
    this.name = 'ChannelBindingNotFoundError';
  }
}

export class ChannelBindingInactiveError extends Error {
  constructor(message = 'Channel binding is inactive') {
    super(message);
    this.name = 'ChannelBindingInactiveError';
  }
}

export class InvalidChannelPayloadError extends Error {
  constructor(message = 'Invalid channel payload') {
    super(message);
    this.name = 'InvalidChannelPayloadError';
  }
}

export class DuplicateMessageError extends Error {
  constructor(message = 'Duplicate message detected') {
    super(message);
    this.name = 'DuplicateMessageError';
  }
}

export class UnsupportedChannelError extends Error {
  constructor(message = 'Unsupported channel type') {
    super(message);
    this.name = 'UnsupportedChannelError';
  }
}
