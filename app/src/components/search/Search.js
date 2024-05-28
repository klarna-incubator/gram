import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  TablePagination,
  Typography,
} from "@mui/material";
import { uniq } from "lodash";
import { useListSystemsQuery } from "../../api/gram/system";
import { SystemComplianceBadge } from "../elements/SystemComplianceBadge";
import Loading from "../loading";

import { CenteredPage } from "../elements/CenteredPage";
import { useSearchQuery } from "../../api/gram/search";

export default function Search() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const queryValue = query.get("query") || "";

  const { data, isLoading } = useSearchQuery({
    searchText: queryValue,
    types: ["system", "team", "model"],
  });

  return (
    <CenteredPage>
      <Card sx={{ maxWidth: "md" }}>
        <CardContent>
          <Typography variant="h5">
            Search results for "{queryValue}"
          </Typography>
        </CardContent>
      </Card>
      <br />
      <Divider />
      <br />
      <>
        {!isLoading ? (
          <>
            {data.map((r) => (
              <>
                <Card sx={{ maxWidth: "md" }}>
                  <CardContent>
                    <Typography variant="h5">{r.type}s</Typography>
                    {r.items && r.items.length === 0 && (
                      <Typography variant="body2">
                        No {r.type}s found
                      </Typography>
                    )}
                    <List>
                      {r.items &&
                        r.items.map((item) => (
                          <ListItemButton
                            component={Link}
                            to={item.url}
                            key={item.id}
                          >
                            <ListItemText
                              primary={item.label}
                              secondary={item.id}
                            />
                            {/* <SystemComplianceBadge compliance={system.compliance} /> */}
                          </ListItemButton>
                        ))}
                    </List>
                    {r.count > 0 && <Pagination count={1} />}
                  </CardContent>
                </Card>
                <br />
              </>
            ))}
          </>
        ) : (
          <Loading />
        )}
      </>
    </CenteredPage>
  );
}
