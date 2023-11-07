import { Grid, Typography } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { useGetUserQuery } from "../../../api/gram/auth";
import { useTitle } from "../../../hooks/useTitle";
import { TeamSystemsPageList } from "./TeamSystemsPageList";
import { TeamHeader } from "./TeamHeader";

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
    <div className="container">
      {!teamId ? (
        <>
          <Typography variant={"h5"}>Your Team Systems</Typography>
          <Typography className="dimmed">
            Systems belonging to your team{teams.length > 1 ? "s" : ""}
          </Typography>
        </>
      ) : (
        <TeamHeader teamId={teamId} />
      )}

      <Grid
        container
        spacing={2}
        alignItems="stretch"
        sx={{ marginTop: "9px" }}
      >
        {/* Some employees have more than one team */}
        {teams.map((tid) => (
          <Grid item xs={6} sx={{ display: "flex", flexDirection: "column" }}>
            <TeamSystemsPageList key={tid} teamId={tid} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
