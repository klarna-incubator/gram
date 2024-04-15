import {
  Card,
  CardActions,
  CardContent,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useListSystemsQuery } from "../../../api/gram/system";
import { SystemComplianceBadge } from "../../elements/SystemComplianceBadge";
import Loading from "../../loading";
import "../Systems.css";
import { useGetTeamQuery } from "../../../api/gram/team";

export function TeamSystemsPageList({ teamId, pagesize = 10 }) {
  const [page, setPage] = useState(0);

  const opts = { filter: "team", teamId, pagesize, page };
  const {
    data: teamSystems,
    isLoading,
    isFetching,
  } = useListSystemsQuery(opts);
  const { data: team } = useGetTeamQuery({ teamId });
  const pageCount =
    teamSystems?.total && teamSystems?.pageSize
      ? Math.ceil(teamSystems?.total / teamSystems?.pageSize)
      : 0;

  const systems = teamSystems ? [...teamSystems?.systems] : [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">
          <Link to={`/team/${teamId}`}>{team?.name}</Link>
        </Typography>

        <List sx={{ overflow: "auto" }}>
          {isLoading || isFetching ? (
            <Loading />
          ) : systems ? (
            systems.map((system, i) => (
              <>
                <ListItemButton
                  component={Link}
                  to={`/system/${system.id}`}
                  key={system.id}
                >
                  <ListItemText primary={system.displayName} />
                  <SystemComplianceBadge compliance={system.compliance} />
                </ListItemButton>
                {i < systems.length - 1 && <Divider component="li" />}
              </>
            ))
          ) : (
            <ListItemText primary="No team systems available." />
          )}
        </List>
      </CardContent>
      <CardActions>
        {!isLoading && pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={
              page + 1
            } /* hack here to translate between APIs zero-pagination vs MUIs one-pagination */
            onChange={(_, p) => setPage(p - 1)}
          />
        )}
      </CardActions>
    </Card>
  );
}
