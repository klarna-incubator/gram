import { cleanup, render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { createMockStore } from "redux-test-utils";
import { MockTheme } from "../../MockTheme";
import { Navbar } from "./Navbar";

const store = createMockStore({
  navbar: { troll: "no" },
  user: { picture: "", name: "testname" },
  login: { authenticated: true },
  auth: { authenticated: true },
});

const renderComponent = (props) =>
  render(
    <Provider store={store}>
      <Router>
        <MockTheme>
          <Navbar {...props} />
        </MockTheme>
      </Router>
    </Provider>
  );

describe("Navbar", () => {
  it("renders Navbar", () => {
    expect(renderComponent()).toMatchSnapshot();
  });

  afterAll(() => {
    cleanup();
  });
});
