import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";

export function MockTheme({ children }) {
  const theme = createTheme({});
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
