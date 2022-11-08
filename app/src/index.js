import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./redux/store";
import * as serviceWorker from "./serviceWorker";

// Sentry is our exception/error capturing tool.
console.log(`Running gram@${process.env.REACT_APP_VERSION}`);
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    release: `gram_app@${process.env.REACT_APP_VERSION}`,
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    tracesSampleRate: 1.0,
    // This will tag issues in sentry based on the hostname
    environment: document.location.origin,
  });
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
