import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import { useListModelsQuery } from "../../../api/gram/model";
import { useTitle } from "../../../hooks/useTitle";
import { ModelList } from "../../elements/list/ModelList";

export default function UserModels() {
  const {
    data: models,
    isLoading,
    error,
  } = useListModelsQuery({ filter: "user" });

  useTitle("My Models");

  return (
    <div className="container">
      <Grid container>
        <Grid item xs={6}>
          <Typography variant={"h5"}>Your Models</Typography>
          <Typography className={"dimmed"}>
            These models are bound to your account and not bound to a specific
            system.
          </Typography>

          <br />

          <Box>
            <Link to={`/model/new`}>
              <Button variant="outlined">Create New Model</Button>
            </Link>
          </Box>

          <br />

          <Divider />

          <ModelList
            models={models}
            error={error}
            isLoading={isLoading}
            listHeight={900}
          />
        </Grid>
      </Grid>
    </div>
  );
}
