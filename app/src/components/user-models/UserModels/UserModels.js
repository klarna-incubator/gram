import { Box, Button, Divider, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
import { Link } from "react-router-dom";
import { useListModelsQuery } from "../../../api/gram/model";
import { useTitle } from "../../../hooks/useTitle";
import { ModelList } from "../../elements/list/ModelList";
import { CenteredPage } from "../../elements/CenteredPage";

export default function UserModels() {
  const {
    data: models,
    isLoading,
    error,
  } = useListModelsQuery({ filter: "user" });

  useTitle("My Models");

  return (
    <CenteredPage>
      <Grid size={6}>
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
    </CenteredPage>
  );
}
