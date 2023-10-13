import {
  Card,
  CardActions,
  CardContent,
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

export function TeamSystemsPageList({
  teamName,
  teamId,
  pagesize = 10,
  listHeight = "500px",
  width = "45%",
}) {
  const [page, setPage] = useState(0);

  const opts = { filter: "team", teamId, pagesize, page };
  const { data, isLoading, isFetching } = useListSystemsQuery(opts);
  const { data: team } = useGetTeamQuery({ teamId });

  return (
    <Card sx={{ width, marginTop: "25px" }}>
      <CardContent>
        <Typography variant="h5">
          <Link to={`/team/${teamId}`}>{team?.name}</Link>
        </Typography>

        <List sx={{ height: listHeight, overflow: "auto" }}>
          {isLoading || isFetching ? (
            <Loading />
          ) : data.systems ? (
            data.systems.map((system) => (
              <ListItemButton
                component={Link}
                to={`/system/${system.id}`}
                key={system.id}
              >
                <ListItemText primary={system.displayName} />
                <SystemComplianceBadge compliance={system.compliance} />
              </ListItemButton>
            ))
          ) : (
            <ListItemText primary="No team systems available." />
          )}
        </List>
      </CardContent>
      <CardActions>
        {!isLoading && (
          <Pagination
            count={Math.ceil(data.total / data.pageSize)}
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
