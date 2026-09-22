import React from "react";
import { render } from "@testing-library/react";
import { RequestError } from "./RequestError";

// Stubbed out because it reaches for the contact endpoint through RTK Query,
// which would need a configured store to render.
jest.mock("./ContactChip", () => ({
  ContactChip: () => "Gram Support",
}));

describe("RequestError", () => {
  it("shows the status and points the user at the team in charge", () => {
    const { container } = render(<RequestError error={{ status: 500 }} />);

    expect(container.textContent).toContain("Request failed with status 500");
    expect(container.textContent).toContain("Please reach out to");
    expect(container.textContent).toContain("Gram Support");
  });

  it("does not render the response body", () => {
    const { container } = render(
      <RequestError
        error={{
          status: 500,
          data: {
            message: "Review object has invalid model id",
            stack: "at buildReviewNotificationVariables",
          },
        }}
      />
    );

    expect(container.textContent).not.toContain("invalid model id");
    expect(container.textContent).not.toContain(
      "buildReviewNotificationVariables"
    );
  });
});
