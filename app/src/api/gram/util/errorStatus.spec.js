import { errorMessage, errorStatus } from "./errorStatus";

describe("errorStatus", () => {
  it("reads a numeric status", () => {
    expect(errorStatus({ status: 500 })).toEqual(500);
  });

  it("falls back to originalStatus when status is a string tag", () => {
    expect(
      errorStatus({ status: "PARSING_ERROR", originalStatus: 500 })
    ).toEqual(500);
  });

  it("returns undefined when there is no status", () => {
    expect(errorStatus(undefined)).toBeUndefined();
    expect(
      errorStatus({ status: "FETCH_ERROR", error: "boom" })
    ).toBeUndefined();
  });
});

describe("errorMessage", () => {
  it("returns undefined when there is no error", () => {
    expect(errorMessage(undefined)).toBeUndefined();
  });

  it("reports the status without the response body", () => {
    expect(errorMessage({ status: 403, data: {} })).toEqual(
      "Request failed with status 403"
    );
  });

  it("does not leak the message or stack the API returns in development", () => {
    expect(
      errorMessage({
        status: 500,
        data: {
          message: "Review object has invalid model id",
          stack: "at buildReviewNotificationVariables",
        },
      })
    ).toEqual("Request failed with status 500");
  });

  it("does not leak a plain-text body as returned in production", () => {
    expect(
      errorMessage({ status: 500, data: "Something went wrong." })
    ).toEqual("Request failed with status 500");
  });

  it("does not leak validation detail", () => {
    expect(
      errorMessage({ status: 400, data: { error: [{ path: ["note"] }] } })
    ).toEqual("Request failed with status 400");
  });

  it("reports the underlying status when the body could not be parsed", () => {
    expect(
      errorMessage({
        status: "PARSING_ERROR",
        originalStatus: 500,
        data: "<html>",
      })
    ).toEqual("Request failed with status 500");
  });

  it("falls back to a generic message when the request never reached the API", () => {
    expect(
      errorMessage({ status: "FETCH_ERROR", error: "Failed to fetch" })
    ).toEqual("Request failed");
  });

  it("never returns an object, so it is safe as a React child", () => {
    expect(
      typeof errorMessage({ status: 500, data: { message: "x" } })
    ).toEqual("string");
  });
});
