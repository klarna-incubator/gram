import React from "react";
import { cleanup, render } from "@testing-library/react";
import { Login } from "./Login";
import { BrowserRouter as Router } from "react-router-dom";

const mockGoogleSignIn = jest.fn();
const mockUseNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  return jest.fn(() => ({
    useNavigate: mockUseNavigate,
    useSearchParams: jest.fn(),
  }));
});

const wrappedRender = (login) =>
  render(
    <Router>
      <Login />
    </Router>
  );

describe.skip("Login", () => {
  it("should render successfully", () => {
    const login = {
      signInRequired: true,
    };
    const { queryByText } = wrappedRender(login);
    expect(
      queryByText("Authentication required", { selector: "div#login > p" })
    ).toBeTruthy();
    expect(mockGoogleSignIn).toHaveBeenCalledTimes(1);
  });

  it("should render with loading component", () => {
    const login = {
      signInRequired: false,
    };
    const { container } = wrappedRender(login, mockGoogleSignIn);
    const target = container.querySelector("div#login > div.loading");
    expect(target).toBeTruthy();
  });

  it("should render with error page on 403 error", () => {
    const login = {
      error: 403,
    };
    const { container, queryByText } = wrappedRender(login, mockGoogleSignIn);
    const target = container.firstChild;
    expect(target.getAttribute("id")).toBe("error-page");
    expect(queryByText("403")).toBeTruthy();
  });

  it("should render with error page on 500 error", () => {
    const login = {
      error: 500,
    };
    const { container, queryByText } = wrappedRender(login, mockGoogleSignIn);
    const target = container.firstChild;
    expect(target.getAttribute("id")).toBe("error-page");
    expect(queryByText("500")).toBeTruthy();
  });

  it("should render Redirect on authenticated prop", () => {
    const login = {
      authenticated: true,
    };

    const { container } = wrappedRender();
    expect(mockUseNavigate.mock.calls[0][0]).toBe("/");
  });

  afterAll(() => {
    cleanup();
  });
});
