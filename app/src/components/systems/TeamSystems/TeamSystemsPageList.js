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
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useListSystemsQuery } from "../../../api/gram/system";
import { SystemComplianceBadge } from "../../elements/SystemComplianceBadge";
import Loading from "../../loading";
import { useGetTeamQuery } from "../../../api/gram/team";

export function TeamSystemsPageList({ teamId, pagesize = 8 }) {
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
    <Card sx={{ width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography
          variant="h5"
          sx={{
            color: "#eee",
            textDecoration: "none",
          }}
        >
          <Link
            to={`/team/${teamId}`}
            style={{
              color: "#eee",
              textDecoration: "none",
            }}
          >
            {team?.name}
          </Link>
        </Typography>

        <List sx={{ overflow: "auto" }}>
          {isLoading || isFetching ? (
            <Loading />
          ) : systems ? (
            systems.map((system, i) => (
              <Fragment key={`sys-${system.id}`}>
                <ListItemButton
                  component={Link}
                  to={`/system/${system.id}`}
                  key={`sys-btn-${system.id}`}
                >
                  <ListItemText
                    primary={system.displayName}
                    secondary={system.id}
                  />
                  <SystemComplianceBadge compliance={system.compliance} />
                </ListItemButton>
                {i < systems.length - 1 && <Divider component="li" />}
              </Fragment>
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
