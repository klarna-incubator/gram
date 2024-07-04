import { Card, CardContent, Divider, Grid, Typography } from "@mui/material";
import React from "react";
import { useLocation } from "react-router-dom";
import Loading from "../loading";

import { useGetSearchTypesQuery } from "../../api/gram/search";
import { CenteredPage } from "../elements/CenteredPage";
import { SearchResultBox } from "./SearchResultBox";

export default function SearchPage() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const queryValue = query.get("query") || "";

  const { data, isLoading } = useGetSearchTypesQuery();

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
          <Grid container spacing={2}>
            {data?.map((searchType) => (
              <Grid item md={4}>
                <SearchResultBox searchText={queryValue} type={searchType} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Loading />
        )}
      </>
    </CenteredPage>
  );
}
