import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
import { useListModelsQuery } from "../../api/gram/model";
import { useGetUserQuery } from "../../api/gram/user";
import { ModelList } from "../elements/list/ModelList";
import { TeamSystemsPageList } from "../systems/TeamSystems/TeamSystemsPageList";
import { CenteredPage } from "../elements/CenteredPage";

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
    <CenteredPage>
      <Grid
        size={6}
        maxHeight="88vh"
        sx={{ display: "flex", flexFlow: "column" }}
      >
        <Typography variant="h5">Recent Threat Models</Typography>
        <Typography className="dimmed">
          Threat models you recently interacted with
        </Typography>
        <ModelList models={recentModels} error={isError} pending={isLoading} />
      </Grid>
      {user?.teams?.length > 0 && (
        <Grid
          size={6}
          columns={1}
          maxHeight="88vh"
          sx={{ display: "flex", flexFlow: "column" }}
        >
          <Typography variant="h5">Team Systems</Typography>
          <Typography className="dimmed">
            Systems owned by the accountable teams you're in
          </Typography>
          <Box
            size={6}
            sx={{
              overflow: "auto",
              marginTop: "25px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Grid container spacing={2} columns={1} style={{ flex: "2" }}>
              {user?.teams &&
                user.teams.map((team, i) => (
                  <Grid size={1}>
                    <TeamSystemsPageList
                      key={team.id}
                      teamId={team.id}
                      pagesize={user?.teams.length > 1 ? 5 : 10}
                    />
                  </Grid>
                ))}
            </Grid>
          </Box>
        </Grid>
      )}
    </CenteredPage>
  );
}
