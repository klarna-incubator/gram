import { Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useListModelsQuery } from "../../../api/gram/model";
import { useTitle } from "../../../hooks/useTitle";
import { ModelList } from "../../elements/list/ModelList";

import "./UserModels.css";

export default function UserModels() {
  const navigate = useNavigate();
  const navigateToNewModel = () => navigate("/model/new");

  const {
    data: models,
    isLoading,
    error,
  } = useListModelsQuery({ filter: "user" });

  useTitle("My Models");

  return (
    <div id="models" className="container">
      <Typography variant={"h5"}>Your Models</Typography>
      <p className="dimmed with-bottom-padding">
        These models are bound to your account and not bound to a specific
        system. You can still share them with other users though.
      </p>
      <div className="row space-between">
        <button className="standard" onClick={navigateToNewModel}>
          Create New Model
        </button>
      </div>

      <ModelList
        models={models}
        error={error}
        isLoading={isLoading}
        listHeight={900}
      />
    </div>
  );
}
