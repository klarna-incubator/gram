import {
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearchQuery } from "../../api/gram/search";

export function SearchResultBox({ searchText, type }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useSearchQuery({
    searchText,
    types: [type.key],
    page: page - 1,
  });

  const r = isLoading ? null : data[0];

  if (isFetching || isLoading) {
    return (
      <Card sx={{ maxWidth: "sm" }}>
        <CardContent>
          <Typography variant="h5">{type.label}s</Typography>
          <br />
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: "sm" }}>
      <CardContent>
        <Typography variant="h5">
          {type.label}s {r.count > 0 && <>({r.count})</>}
        </Typography>
        {r.items && r.items.length === 0 && (
          <Typography variant="body2" sx={{ marginTop: 1 }}>
            No {type.label}s found
          </Typography>
        )}
        <List>
          {r.items &&
            r.items.map((item) => (
              <ListItemButton
                component={Link}
                to={item.url}
                key={item.id}
                style={{ lineHeight: 1, margin: 0, padding: 0 }}
              >
                <ListItemText primary={item.label} secondary={item.id} />
              </ListItemButton>
            ))}
        </List>
        {r.count > 0 && (
          <Pagination
            count={Math.floor(r.count / 10) || 1}
            page={page}
            onChange={(_, np) => setPage(np)}
          />
        )}
      </CardContent>
    </Card>
  );
}
