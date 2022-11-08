export class InvalidSecretError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSecretError";
    Object.setPrototypeOf(this, InvalidSecretError.prototype);
  }
}

export class InvalidSecretProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSecretProvider";
    Object.setPrototypeOf(this, InvalidSecretProviderError.prototype);
  }
}
