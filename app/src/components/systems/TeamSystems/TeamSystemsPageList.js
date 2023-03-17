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

export function TeamSystemsPageList({
  teamId,
  pagesize = 15,
  listHeight = "500px",
  width = "45%",
}) {
  const [page, setPage] = useState(0);

  const opts = { filter: "team", teamId, pagesize, page };
  const { data, isLoading, isFetching } = useListSystemsQuery(opts);

  // Because too lazy to write a new endpoint to fetch team name.
  const teamName =
    data && data.systems.length > 0 && data.systems[0].owners.length > 0
      ? data.systems[0].owners[0].name
      : "Team";

  return (
    <Card sx={{ width, marginTop: "25px" }}>
      <CardContent>
        <Typography variant="h5">{teamName}</Typography>

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
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        )}
      </CardActions>
    </Card>
  );
}
