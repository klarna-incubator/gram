import { Box, Button, Grid, Typography } from "@mui/material";
import React from "react";
import { Link, useMatch } from "react-router-dom";
import { useListModelsQuery } from "../../api/gram/model";
import {
  useGetSystemPermissionsQuery,
  useGetSystemQuery,
} from "../../api/gram/system";
import { useTitle } from "../../hooks/useTitle";
import { ErrorPage } from "../elements/ErrorPage";
import { ModelList } from "../elements/list/ModelList";
import Loading from "../loading";
import { PERMISSIONS } from "../model/constants";
import "./System.css";
import { CenteredPage } from "../elements/CenteredPage";

export function System() {
  const match = useMatch("/system/:id");
  const systemId = match.params.id;

  const { data: permissions, isLoading: isLoadingPermissions } =
    useGetSystemPermissionsQuery({ systemId });
  const {
    data: system,
    isLoading: isLoadingSystem,
    isError,
    error,
  } = useGetSystemQuery({
    systemId,
  });
  const { data: models, isLoading: isLoadingModels } = useListModelsQuery({
    filter: "system",
    systemId,
  });

  useTitle(isLoadingSystem ? "Loading..." : "System: " + system?.displayName);

  if (isLoadingPermissions || isLoadingSystem) {
    return (
      <div className="pending">
        <p>Please wait while we load this system.</p>
        <Loading />
      </div>
    );
  }

  if (isError) {
    return <ErrorPage code={error.originalStatus} />;
  }

  if (!permissions.includes(PERMISSIONS.READ)) {
    return <ErrorPage code={403} />;
  }

  return (
    <CenteredPage>
      <Grid container>
        <Grid item xs={6}>
          <Typography variant={"h5"}>
            {system.displayName}{" "}
            <span className="dimmed">&mdash; {system.shortName}</span>
          </Typography>

          <Typography className="dimmed">
            {system.owners?.map((owner) => (
              <Link className="dimmed" to={`/team/${owner.id}`}>
                {owner.name}
              </Link>
            ))}{" "}
            &mdash;{" "}
            <span className="description">
              {system.description || "(system has no description)"}
            </span>
          </Typography>

          {permissions.includes(PERMISSIONS.WRITE) && (
            <Box sx={{ marginTop: "25px", marginBottom: "25px" }}>
              <Link to={`/model/new?system_id=${system.id}`}>
                <Button variant="outlined">Create New Threat Model</Button>
              </Link>
            </Box>
          )}

          <Typography variant="h6">Threat Models</Typography>

          <ModelList
            models={models}
            isLoading={isLoadingModels}
            listHeight="100%"
          />
        </Grid>
      </Grid>
    </CenteredPage>
  );
}
