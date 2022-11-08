import { SSMSecretProvider } from ".";
import { InvalidSecretError } from "../errors";
import { getParameterFn } from "./__mocks__/aws-sdk";

const secrets = new SSMSecretProvider();

const getParameterError = jest.fn().mockReturnValue({
  promise: jest.fn().mockRejectedValue("error"),
});

const getParameterSuccess = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Parameter: {
      Value: "test",
    },
  }),
});

describe("Secrets from AWS ssm", () => {
  jest.mock("aws-sdk");
  const OLD_ENV = process.env;

  beforeAll(() => {
    getParameterFn.mockClear();
    process.env.PARAMETER_SECRET_PATH = "/test/valid";
  });

  it("should append proper ssm prefix based on config", async () => {
    getParameterFn.mockImplementation(getParameterSuccess);
    const secret = await secrets.get("name.something");
    const arg = getParameterSuccess.mock.calls[0][0];
    expect(arg.Name).toBe("/test/valid/name.something");
  });

  it("should error from unset ssm path", async () => {
    getParameterFn.mockImplementation(getParameterError);
    expect(secrets.get("some.bad.path")).rejects.toThrow(InvalidSecretError);
  });

  it("should return valid value from ssm path", async () => {
    getParameterFn.mockImplementation(getParameterSuccess);
    const secret = await secrets.get("valid.path");
    expect(secret).toBe("test");
  });

  afterAll(() => {
    process.env = OLD_ENV; // restore old env
    jest.restoreAllMocks();
  });
});
