import React from "react";
import { useIsFramed } from "../../hooks/useIsFramed";
import Grid from "@mui/material/Grid2";

export function CenteredPage({ children }) {
  const isFramed = useIsFramed();
  return (
    <Grid
      container
      spacing={0}
      direction="row"
      alignItems="center"
      justifyContent="center"
    >
      <Grid width={"80%"} marginTop={isFramed ? "" : "84px"}>
        {children}
      </Grid>
    </Grid>
  );
}
