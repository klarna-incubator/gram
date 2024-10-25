import React from "react";
import Grid from "@mui/material/Grid2";

export function CenteredPage({ children, marginTop = true }) {
  return (
    <Grid
      container
      columns={12}
      spacing={2}
      direction="row"
      marginTop={marginTop ? "20px" : ""}
      marginX={"auto"}
      maxWidth={"80%"}
    >
      {children}
    </Grid>
  );
}
