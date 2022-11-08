import React from "react";
import { cleanup, render } from "@testing-library/react";
import ErrorLine from "./ErrorLine";

describe("ErrorLine", () => {
  it("should render successfully", () => {
    const { queryByText } = render(<ErrorLine message="test" />);
    expect(queryByText("test", { selector: "div.error-line" })).toBeTruthy();
  });

  afterAll(() => {
    cleanup();
  });
});
