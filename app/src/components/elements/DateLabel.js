import React from "react";

export function DateLabel({ ts, detailed }) {
  if (!ts) {
    return <span>...</span>;
  }
  const dateTime = new Date(ts);
  const full = dateTime.toISOString();
  if (detailed) {
    return <span>{full}</span>;
  }
  return <span title={full}>{full.substring(0, 10)}</span>;
}
