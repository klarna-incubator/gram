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

  return (
    <div id="error-page">
      <p className="big">{code.toString()}</p>
      <p className="desc">{desc[code.toString()]}</p>
    </div>
  );
}
