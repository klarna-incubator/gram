import { Typography } from "@mui/material";
import React from "react";
import { Link, useMatch } from "react-router-dom";
import { useListModelsQuery } from "../../api/gram/model";
import {
  useGetSystemPermissionsQuery,
  useGetSystemQuery,
} from "../../api/gram/system";
import { useTitle } from "../../hooks/useTitle";
import { ModelList } from "../elements/list/ModelList";
import ErrorPage from "../error-page";
import Loading from "../loading";
import { PERMISSIONS } from "../model/constants";
import "./System.css";

export function System() {
  const match = useMatch("/system/:id");
  const systemId = match.params.id;

  const { data: permissions, isLoading: isLoadingPermissions } =
    useGetSystemPermissionsQuery({ systemId });
  const { data: system, isLoading: isLoadingSystem } = useGetSystemQuery({
    systemId,
  });
  const { data: models, isLoading: isLoadingModels } = useListModelsQuery({
    filter: "system",
    systemId,
  });

  useTitle(isLoadingSystem ? "Loading..." : "System: " + system.displayName);

  if (isLoadingPermissions || isLoadingSystem) {
    return (
      <div className="pending">
        <p>Please wait while we load this system.</p>
        <Loading />
      </div>
    );
  }

  if (!permissions.includes(PERMISSIONS.READ)) {
    return <ErrorPage code={403} />;
  }

  return (
    <div id="system">
      <h1 className="title">
        {system.displayName}{" "}
        <span className="shortName">&mdash; {system.shortName}</span>
      </h1>
      <span className="team">
        {system.owners?.map((owner) => (
          <Link to={`/team/${owner.id}`}>{owner.name}</Link>
        ))}
      </span>
      <span className="divider"> &mdash; </span>
      <span className="description">
        {system.description || "(system has no description)"}
      </span>

      <div className="threat-models">
        {permissions.includes(PERMISSIONS.WRITE) && (
          <Link to={`/model/new?system_id=${system.id}`}>
            <button className="standard">Create New Threat Model</button>
          </Link>
        )}

        <Typography variant="h5">Threat Models</Typography>

        <ModelList
          models={models}
          isLoading={isLoadingModels}
          listHeight="100%"
        />
      </div>
    </div>
  );
}

export default System;
