import React from "react";
import { Provider } from "react-redux";
import { cleanup, render } from "@testing-library/react";
import Home from "./Home";
import { BrowserRouter as Router } from "react-router-dom";
import { createMockStore } from "redux-test-utils";

const store = createMockStore({
  user: {
    name: "kanelbulle",
  },
  models: {
    recentModels: {
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
        <Home />
      </Router>
    </Provider>
  );

describe("Home", () => {
  it.skip("renders Home", () => {
    // const props = {
    //   getTeamSystems: jest.fn(),
    //   getRecentModels: jest.fn(),
    //   recentModels: {
    //     pending: false,
    //     error: null,
    //     models: [{ id: 123, systemId: "system", version: "ver.1" }],
    //   },
    //   teamSystems: {
    //     pending: false,
    //     error: null,
    //     systems: [{ id: 123, displayName: "systemName", team: "team" }],
    //   },
    // };
    expect(renderComponent()).toMatchSnapshot();
  });

  afterAll(() => {
    cleanup();
  });
});
