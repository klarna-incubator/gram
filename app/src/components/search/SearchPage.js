import { Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
import { useLocation } from "react-router-dom";
import { useGetSearchTypesQuery } from "../../api/gram/search";
import { CenteredPage } from "../elements/CenteredPage";
import Loading from "../loading";
import { SearchResultBox } from "./SearchResultBox";

export default function SearchPage() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const queryValue = query.get("query") || "";

  const { data, isLoading } = useGetSearchTypesQuery();

  return (
    <CenteredPage>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h5">
              Search results for "{queryValue}"
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {!isLoading ? (
        <>
          {data?.map((searchType) => (
            <Grid size={4}>
              <SearchResultBox searchText={queryValue} type={searchType} />
            </Grid>
          ))}
        </>
      ) : (
        <Loading />
      )}
    </CenteredPage>
  );
}
