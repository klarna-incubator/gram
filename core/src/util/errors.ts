export class NotFoundError extends Error {
  constructor() {
    super();

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class InvalidInputError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

export class NotAuthenticatedError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
  }
}
