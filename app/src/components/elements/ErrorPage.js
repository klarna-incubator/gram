import React from "react";
import "./ErrorPage.css";
import { useTitle } from "../../hooks/useTitle";

const desc = {
  404: "The page you are looking for does not exist",
  403: "You are not allowed to access this resource",
  500: "Something went terribly wrong. Try checking browser console for errors",
};

export function ErrorPage({ code }) {
  useTitle("Page not found");

  // An error can reach us without a usable status, e.g. a network failure or an
  // error shape we didn't anticipate. Fall back to 500 rather than crashing.
  const status = Number.isInteger(code) ? code : 500;

  return (
    <div id="error-page">
      <p className="big">{status}</p>
      <p className="desc">{desc[status] ?? desc[500]}</p>
    </div>
  );
}
