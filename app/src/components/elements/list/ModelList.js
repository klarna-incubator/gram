import {
  Card,
  CardContent,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import Loading from "../../loading";
import { SystemName } from "../../reviews/SystemName";
import { DateLabel } from "../DateLabel";
import { ErrorLine } from "../ErrorLine";
import { ModelComplianceBadge } from "../ModelComplianceBadge";

export function ModelList({
  models = [],
  error,
  isLoading,
  errorMessage = "Error loading data",
  emptyMessage = "No models exist",
}) {
  return (
    <Card sx={{ marginTop: "25px", overflow: "auto" }}>
      <CardContent>
        {isLoading && <Loading />}
        {error && <ErrorLine message={errorMessage} />}
        <List>
          {(!models || models.length === 0) && (
            <ListItemText primary={emptyMessage} />
          )}
          {Array.isArray(models) &&
            models.map((model, i) => (
              <>
                <ListItemButton
                  component={Link}
                  to={`/model/${model.id}`}
                  key={model.id}
                >
                  <ListItemText
                    primary={
                      <>
                        {model.version}
                        <span style={{ float: "right" }}>
                          <ModelComplianceBadge {...model} />
                        </span>
                      </>
                    }
                    secondary={
                      <>
                        {model.systemId && (
                          <span>
                            <SystemName systemId={model.systemId} /> &nbsp;
                          </span>
                        )}
                        <span>
                          Last Updated <DateLabel ts={model.updatedAt} />
                        </span>
                      </>
                    }
                  />
                </ListItemButton>
                {i < models.length - 1 && <Divider component="li" />}
              </>
            ))}
        </List>
      </CardContent>
    </Card>
  );
}
