import { cleanup, render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./redux/store";

describe("App", () => {
  it("should render successfully", () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });

  afterAll(() => {
    cleanup();
  });
});
