import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useCreateModelMutation,
  useGetTemplatesQuery,
  useListModelsQuery,
} from "../../api/gram/model";
import { useGetSystemQuery } from "../../api/gram/system";
import { CenteredPage } from "../elements/CenteredPage";
import { ErrorLine } from "../elements/ErrorLine";
import Loading from "../loading";
import { ModelPreview } from "./ModelPreview";
import "./New.css";

export function NewWizard() {
  const [version, setVersion] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [buttonText, setButtonText] = useState("Create");
  const [sourceModelId, setSourceModelId] = useState("");
  const [sourceTemplateId, setSourceTemplateId] = useState("");

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const systemId = queryParams.get("system_id");
  const navigate = useNavigate();

  const { data: system } = useGetSystemQuery({ systemId });
  const { data: models } = useListModelsQuery({ filter: "system", systemId });

  const [createModel, result] = useCreateModelMutation();

  const { data: templates } = useGetTemplatesQuery();
  // -----------------------------------------------------------------------
  // Hooks
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (result.data && result.data.id) {
      navigate(`/model/${result.data.id}`);
    }
  }, [navigate, result]);

  useEffect(() => {
    if (result.error) {
      setButtonText("Create");
    }
  }, [setButtonText, result.error]);

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  const onClickFinish = () => {
    setButtonText("Creating...");
    if (sourceTemplateId) {
      return createModel({
        version,
        systemId,
        sourceModelId: sourceTemplateId,
      });
    }

    if (sourceModelId) {
      return createModel({ version, systemId, sourceModelId });
    }

    return createModel({ version, systemId });
  };

  const onChangeVersion = (e) => {
    setVersion(e.target.value);
  };

  const onChangeImport = (e) => {
    setSourceModelId(e.target.value);
  };

  const onChangeTemplate = (e) => {
    setSourceTemplateId(e.target.value);
  };
  // -----------------------------------------------------------------------
  // Renders
  // -----------------------------------------------------------------------

  return (
    <CenteredPage>
      <Grid container>
        <Grid size={3} id="new-wizard">
          {result && result.error && (
            <ErrorLine message="Something went wrong while trying to create the model" />
          )}

          <h1 className="title">New Threat Model</h1>
          {system && system.system && systemId && (
            <h2 className="subtitle">{system.system.displayName}</h2>
          )}
          {(models?.length > 0 || templates?.length > 0) && (
            <h3>Import from another Gram model (optional)</h3>
          )}
          {templates?.length > 0 && (
            <FormControl disabled={!!sourceModelId}>
              <InputLabel id="template-import">
                Import from a template
              </InputLabel>
              <Select
                labelId="template-import"
                id="template-import"
                label="Import from a template"
                onChange={onChangeTemplate}
                defaultValue=""
                value={sourceTemplateId}
              >
                <MenuItem sx={{ minWidth: "100%" }} value="">
                  Do not import
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.version}
                  </MenuItem>
                ))}
              </Select>
              {!!sourceModelId && (
                <FormHelperText>
                  Disabled because you selected previous model
                </FormHelperText>
              )}
            </FormControl>
          )}
          {system && system.pending && <Loading />}
          {systemId && (
            <>
              {templates?.length > 0 && models?.length ? (
                <Divider>OR</Divider>
              ) : (
                <></>
              )}
              {models?.length > 0 && (
                <FormControl disabled={!!sourceTemplateId}>
                  <InputLabel id="modelImport">
                    Import from a previous threat model for this system
                  </InputLabel>
                  <Select
                    labelId="modelImport"
                    id="modelImport"
                    label="Import from a previous threat model for this system"
                    onChange={onChangeImport}
                    defaultValue=""
                  >
                    <MenuItem value="">Do not import</MenuItem>
                    {models &&
                      models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.version}
                        </MenuItem>
                      ))}
                  </Select>
                  {!!sourceTemplateId && (
                    <FormHelperText>
                      Disabled because you selected a template.
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            </>
          )}

          <h3>Provide a version name to identify this threat model by.</h3>
          <TextField
            onChange={onChangeVersion}
            required
            label="Enter Version Name"
            inputProps={{ maxLength: 32, spellCheck: "false" }}
            type="text"
            placeholder={`eg. ${version}`}
            defaultValue={version}
          />
          <Button
            onClick={onClickFinish}
            disabled={!version}
            variant="contained"
            size="large"
          >
            {buttonText}
          </Button>
        </Grid>
        <Grid size={9}>
          {(sourceModelId || sourceTemplateId) && (
            <ModelPreview
              modelId={sourceModelId || sourceTemplateId}
              style={{ width: "100%", height: "100%", border: "0" }}
            />
          )}
        </Grid>
      </Grid>
    </CenteredPage>
  );
}
