export const getParameterFn = jest.fn();

export class SSM {
  constructor() {}
  getParameter = getParameterFn;
}
