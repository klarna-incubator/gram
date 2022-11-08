import React from "react";
import { cleanup, render } from "@testing-library/react";
import ErrorPage from "./ErrorPage";

describe("ErrorPage", () => {
  it("should render 404 page successfully", () => {
    const { queryByText } = render(<ErrorPage code={404} />);
    expect(queryByText("404", { selector: "p.big" })).toBeTruthy();
    expect(
      queryByText("The page you are looking for does not exist", {
        selector: "p.desc",
      })
    ).toBeTruthy();
  });

  it("should render 403 page successfully", () => {
    const { queryByText } = render(<ErrorPage code={403} />);
    expect(queryByText("403", { selector: "p.big" })).toBeTruthy();
    expect(
      queryByText("You are not allowed to access this resource", {
        selector: "p.desc",
      })
    ).toBeTruthy();
  });

  it("should render 500 page successfully", () => {
    const { queryByText } = render(<ErrorPage code={500} />);
    expect(queryByText("500", { selector: "p.big" })).toBeTruthy();
    expect(
      queryByText(
        "Something went terribly wrong. Try checking browser console for errors",
        { selector: "p.desc" }
      )
    ).toBeTruthy();
  });

  it("should render null page successfully", () => {
    const { queryByText } = render(<ErrorPage code={123} />);
    expect(queryByText(/.+/, { selector: "p.desc" })).toBeNull();
  });

  afterAll(() => {
    cleanup();
  });
});
