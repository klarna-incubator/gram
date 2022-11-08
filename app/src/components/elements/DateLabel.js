import React from "react";

export function DateLabel({ ts, detailed }) {
  if (!ts) {
    return <span>...</span>;
  }
  const dateTime = new Date(ts);
  const dateOnly = dateTime.toLocaleDateString();
  const full = `${dateOnly} ${dateTime.toLocaleTimeString()}`;
  if (detailed) {
    return <span>{full}</span>;
  }
  return <span title={full}>{dateOnly}</span>;
}
