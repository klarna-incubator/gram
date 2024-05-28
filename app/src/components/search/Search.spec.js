import React from "react";
import { cleanup, render } from "@testing-library/react";
import Search from "./Search";
import { BrowserRouter as Router } from "react-router-dom";
import { createMockStore } from "redux-test-utils";
import { Provider } from "react-redux";

const store = createMockStore({});

const renderComponent = (props) =>
  render(
    <Provider store={store}>
      <Router>
        <Search {...props} />
      </Router>
    </Provider>
  );

describe("Search", () => {
  it("renders Search", () => {
    expect(renderComponent({})).toMatchSnapshot();
  });

  afterAll(() => {
    cleanup();
  });
});
