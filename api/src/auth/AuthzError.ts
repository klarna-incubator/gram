export class AuthzError extends Error {
  constructor(reason: string) {
    super(reason);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AuthzError.prototype);
  }
}
