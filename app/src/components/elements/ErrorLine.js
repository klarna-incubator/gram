import React from "react";
import "./ErrorLine.css";

export function ErrorLine({ message }) {
  return <div className="error-line">{message}</div>;
}
