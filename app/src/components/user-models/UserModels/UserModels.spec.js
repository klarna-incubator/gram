import React from "react";
import { Provider } from "react-redux";
import { cleanup, render } from "@testing-library/react";
import UserModels from "./UserModels";
import { BrowserRouter as Router } from "react-router-dom";
import { createMockStore } from "redux-test-utils";

const store = createMockStore({
  systems: {
    filteredSystems: {
      systems: [
        {
          id: 123,
          displayName: "SystemName",
          shortName: "short",
        },
      ],
    },
  },
  models: {
    userModels: {
      pending: false,
      error: null,
      models: [{ id: 123, systemId: "system", version: "ver.1" }],
    },
  },
});

const renderComponent = (props) =>
  render(
    <Provider store={store}>
      <Router>
        <UserModels {...props} />
      </Router>
    </Provider>
  );

describe("UserModels", () => {
  it("renders", () => {
    expect(renderComponent()).toMatchSnapshot();
  });

  afterAll(() => {
    cleanup();
  });
});
