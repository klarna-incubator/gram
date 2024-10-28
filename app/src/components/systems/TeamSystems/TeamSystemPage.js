import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
import { useParams } from "react-router-dom";
import { useGetUserQuery } from "../../../api/gram/auth";
import { useTitle } from "../../../hooks/useTitle";
import { TeamSystemsPageList } from "./TeamSystemsPageList";
import { TeamHeader } from "./TeamHeader";
import { CenteredPage } from "../../elements/CenteredPage";

export function TeamSystemsPage() {
  const { teamId } = useParams("/team/:teamId");
  const { data: user } = useGetUserQuery();

  let teams = [];
  if (teamId) {
    teams = [teamId];
  } else {
    teams = user?.teams.map((t) => t.id) || [];
  }

  useTitle("Team");

  return (
    <CenteredPage justifyContent="baseline">
      <Grid container size={12}>
        {!teamId ? (
          <Grid size={12}>
            <Typography variant={"h5"}>Your Team Systems</Typography>
            <Typography className="dimmed">
              Systems belonging to your team{teams.length > 1 ? "s" : ""}
            </Typography>
          </Grid>
        ) : (
          <Grid size={12}>
            <TeamHeader teamId={teamId} />
          </Grid>
        )}

        {/* Some employees have more than one team */}
        {teams.map((tid) => (
          <Grid
            key={`team-grid-${tid}`}
            size={6}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <TeamSystemsPageList key={tid} teamId={tid} />
          </Grid>
        ))}
      </Grid>
    </CenteredPage>
  );
}
