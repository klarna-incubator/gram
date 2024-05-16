import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { uniq } from "lodash";
import { useListSystemsQuery } from "../../../api/gram/system";
import { SystemComplianceBadge } from "../../elements/SystemComplianceBadge";
import Loading from "../../loading";

import { CenteredPage } from "../../elements/CenteredPage";

export default function Search() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const queryValue = query.get("query") || "";

  const { data, isLoading } = useListSystemsQuery({
    filter: "search",
    search: queryValue,
  });

  return (
    <CenteredPage>
      <Card sx={{ maxWidth: "md", width: "33%", margin: "25px" }}>
        <CardContent>
          <Typography variant="h5">
            Search results for "{queryValue}"
          </Typography>
          {!isLoading ? (
            <>
              {data.systems.length === 0 && <p>No systems found</p>}
              <List>
                {data.systems &&
                  data.systems.slice(0, 20).map((system) => (
                    <ListItemButton
                      component={Link}
                      to={`/system/${system.id}`}
                      key={uniq(system.id)}
                    >
                      <ListItemText primary={system.displayName} />
                      <SystemComplianceBadge compliance={system.compliance} />
                    </ListItemButton>
                  ))}
              </List>
            </>
          ) : (
            <Loading />
          )}
        </CardContent>
      </Card>
    </CenteredPage>
  );
}
