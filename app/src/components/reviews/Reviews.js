import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow as MuiTableRow,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useListReviewsQuery } from "../../api/gram/review";
import { useTitle } from "../../hooks/useTitle";
import { LoadingPage } from "../elements/loading/loading-page/LoadingPage";
import { EmptyTableRow } from "./EmptyTableRow";
import { TableHeader } from "./TableHeader";
import { TablePaginationActions } from "./TablePaginationActions";
import { TableRow } from "./TableRow";
import { TableToolbar } from "./TableToolbar";

export function Reviews() {
  useTitle("Reviews");

  const [searchParams, setSearchParams] = useSearchParams();

  const rowsPerPage = 10;

  const { selectedStatuses, selectedProperties, order, page, reviewedBy } = {
    selectedStatuses: searchParams.get("statuses")?.split(",") || [],
    selectedProperties: (searchParams.get("properties") || "")
      .split(",")
      .map((part) => decodeURIComponent(part))
      .map((part) => {
        const [id, value] = part.split(":");
        return { id, value };
      })
      .filter((prop) => !!prop.id),
    order: searchParams.get("order") || "ASC",
    page: parseInt(searchParams.get("page")) || 1,
    reviewedBy: searchParams.get("reviewedBy") || "",
  };

  const { data: reviews, isFetching: reviewsIsFetching } = useListReviewsQuery({
    statuses: selectedStatuses,
    // Somewhat hacky, but API allows for filtering on value which we don't care about here currently.
    // We would need to add new UI to filter on e.g. text values or dropdowns. So we can can change
    // this here when needed.
    properties: selectedProperties.map((p) => `${p.id}:${p.value}`),
    page,
    order,
    reviewedBy: reviewedBy === "-1" ? "" : reviewedBy,
  });

  function handleChangePage(newPage) {
    setSearchParams({
      statuses: selectedStatuses.join(","),
      properties: selectedProperties.join(","),
      order,
      page: newPage,
      reviewedBy,
    });
  }

  function handleToggleOrder(order) {
    setSearchParams({
      statuses: selectedStatuses.join(","),
      properties: selectedProperties.join(","),
      order,
      page,
      reviewedBy,
    });
  }

  function handleStatusFilterChange(status, mode) {
    let selStatuses = selectedStatuses.filter(
      (selStatus) => selStatus !== status
    );

    if (mode === true) {
      selStatuses.push(status);
    }

    setSearchParams({
      statuses: selStatuses.join(","),
      properties: selectedProperties.join(","),
      order,
      page,
      reviewedBy,
    });
  }

  function handlePropertyFilterChange(prop, value) {
    let selProps = selectedProperties.filter(
      (selProp) => selProp.id !== prop.id
    );

    if (value !== -1) {
      selProps.push({ id: prop.id, value });
    }

    setSearchParams({
      statuses: selectedStatuses.join(","),
      properties: selProps.map((prop) => `${prop.id}:${prop.value}`).join(","),
      order,
      page,
      reviewedBy,
    });
  }

  function handleReviewerSelected(value) {
    setSearchParams({
      statuses: selectedStatuses.join(","),
      properties: selectedProperties
        .map((prop) => `${prop.id}:${prop.value}`)
        .join(","),
      order,
      page,
      reviewedBy: value,
    });
  }

  return (
    <Grid
      container
      spacing={0}
      direction={"row"}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <Grid item width={"80%"} marginTop={"50px"}>
        <Paper>
          <TableToolbar
            selectedStatuses={selectedStatuses}
            selectedProperties={selectedProperties}
            onStatusFilterChange={handleStatusFilterChange}
            onPropertyFilterChange={handlePropertyFilterChange}
            onReviewerSelected={handleReviewerSelected}
            reviewedBy={reviewedBy}
          />
          <LoadingPage isLoading={reviewsIsFetching} />
          <TableContainer>
            <Table size={"small"}>
              <TableHeader order={order} toggleOrder={handleToggleOrder} />
              <TableBody>
                {reviews?.total === 0 && <EmptyTableRow />}
                {reviews?.items.map((review) => (
                  <TableRow key={review.modelId} review={review} />
                ))}
              </TableBody>
              <TableFooter>
                <MuiTableRow style={{ borderBottom: "none" }}>
                  <TablePagination
                    style={{ borderBottom: "none" }}
                    rowsPerPageOptions={[rowsPerPage]}
                    count={reviews?.total || 0}
                    rowsPerPage={rowsPerPage}
                    page={page - 1}
                    onPageChange={handleChangePage}
                    ActionsComponent={TablePaginationActions}
                  />
                </MuiTableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}
