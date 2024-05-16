import React from "react";
import { Box } from "@mui/material";
import { useIsFramed } from "../../hooks/useIsFramed";
import "./CenteredPage.css";

export function CenteredPage({ children }) {
  const isFramed = useIsFramed();
  return <Box className={isFramed ? "page" : "page bump"}>{children}</Box>;
}
