import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
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
      <Grid container spacing={2} alignItems="stretch">
        <Grid
          item
          xs={6}
          maxHeight="88vh"
          sx={{ display: "flex", flexFlow: "column" }}
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
            maxHeight="88vh"
            sx={{ display: "flex", flexFlow: "column" }}
          >
            <Typography variant="h5">Team Systems</Typography>
            <Typography className="dimmed">
              Systems owned by the accountable teams you're in
            </Typography>
            <Box
              sx={{
                overflow: "auto",
                marginTop: "25px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Grid
                container
                direction="column"
                spacing={2}
                style={{ flex: "2" }}
              >
                {user?.teams &&
                  user.teams.map((team, i) => (
                    <Grid item xs={6}>
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
      </Grid>
    </CenteredPage>
  );
}
