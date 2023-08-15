import React from "react";
import ErrorLine from "../../error-line";
import Loading from "../../loading";
import {
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Link } from "react-router-dom";
import { SystemName } from "../../reviews/SystemName";
import { DateLabel } from "../DateLabel";
import { ModelComplianceBadge } from "../ModelComplianceBadge";

export function ModelList({
  models = [],
  error,
  isLoading,
  listHeight = "500px",
  width = "45%",
  errorMessage = "Error loading data",
  emptyMessage = "No models exist",
}) {
  return (
    <Card sx={{ width, marginTop: "25px" }}>
      <CardContent>
        {isLoading && <Loading />}
        {error && <ErrorLine message={errorMessage} />}
        <List sx={{ height: listHeight, overflow: "auto" }}>
          {(!models || models.length === 0) && (
            <ListItemText primary={emptyMessage} />
          )}
          {Array.isArray(models) &&
            models.map((model) => (
              <ListItemButton
                component={Link}
                to={`/model/${model.id}`}
                key={model.id}
              >
                <ListItemText
                  primary={model.version}
                  secondary={
                    <>
                      <span>
                        {model.systemId && (
                          <>
                            <SystemName systemId={model.systemId} /> &nbsp;
                          </>
                        )}
                      </span>
                      <span style={{ float: "right" }}>
                        <ModelComplianceBadge {...model} />
                      </span>
                      <span>
                        Last Updated <DateLabel ts={model.updatedAt} />
                      </span>
                    </>
                  }
                />
              </ListItemButton>
            ))}
        </List>
      </CardContent>
      {/* <CardActions>
        {!isLoading && (
          <Pagination
            count={Math.ceil(data.total / data.pageSize)}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        )}
      </CardActions> */}
    </Card>
  );
}
