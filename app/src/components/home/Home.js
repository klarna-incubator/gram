import { Box, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React from "react";
import { useGetUserQuery } from "../../api/gram/auth";
import { useListModelsQuery } from "../../api/gram/model";
import { ModelList } from "../elements/list/ModelList";
import { TeamSystemsPageList } from "../systems/TeamSystems/TeamSystemsPageList";

export default function Home() {
  const { data: user } = useGetUserQuery();

  const {
    data: recentModels,
    isError,
    isLoading,
  } = useListModelsQuery({
    filter: "recent",
    withSystems: true,
  });

  return (
    <div className="container">
      <Grid container spacing={2} alignItems="stretch">
        <Grid
          item
          xs={6}
          maxHeight="87vh"
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Typography variant="h5">Recent Threat Models</Typography>
          <Typography className="dimmed">
            Threat models you recently interacted with
          </Typography>
          <ModelList
            models={recentModels}
            error={isError}
            pending={isLoading}
          />
        </Grid>
        {user?.teams?.length > 0 && (
          <Grid
            item
            xs={6}
            height="87vh"
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <Typography variant="h5">Team Systems</Typography>
            <Typography className="dimmed">
              Systems owned by the accountable teams you're in
            </Typography>
            <Box sx={{ overflow: "auto", marginTop: "25px" }}>
              <Stack spacing={2}>
                {user?.teams &&
                  user.teams.map((team, i) => (
                    <TeamSystemsPageList
                      key={team.id}
                      teamId={team.id}
                      maxHeight={user.teams.length > 1 ? "28vh" : "80vh"}
                    />
                  ))}
              </Stack>
            </Box>
          </Grid>
        )}
      </Grid>
    </div>
  );
}
