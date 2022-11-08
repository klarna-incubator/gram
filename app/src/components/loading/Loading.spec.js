import React from "react";
import { cleanup, render } from "@testing-library/react";
import Loading from "./Loading";

describe("Loading", () => {
  it("should render successfully", () => {
    render(<Loading />);
  });

  afterAll(() => {
    cleanup();
  });
});
