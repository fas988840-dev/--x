/**
 * Error handling for wallet intelligence platform
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RpcError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

export class PriceUnavailableError extends Error {
  constructor(mint: string) {
    super(`Price unavailable for token: ${mint}`);
    this.name = 'PriceUnavailableError';
  }
}

export class DecodingError extends Error {
  constructor(
    message: string,
    public programId: string
  ) {
    super(message);
    this.name = 'DecodingError';
  }
}
