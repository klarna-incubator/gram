import {
  Box,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Stack,
  LinearProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { patchComponent } from "../../../../actions/model/patchComponent";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { MultipleSystemsDropdown } from "../../../elements/MultipleSystemsDropdown";
import { COMPONENT_TYPE } from "../../board/constants";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { TechStacksDropdown } from "./TechStackDropdown";
import { EditableDescription } from "../EditableDescription";
import { ResourceList } from "./ResourceList";
import { useGetResourcesQuery } from "../../../../api/gram/resources";
import {
  useListMatchingQuery,
  useCreateMatchingMutation,
} from "../../../../api/gram/resource-matching";
import { useModelID } from "../../hooks/useModelID";

export function ComponentTab() {
  const dispatch = useDispatch();

  const component = useSelectedComponent();
  const readOnly = useReadOnly();

  const { type, classes, systems } = component;
  const [name, setName] = useState(component.name);
  const [description, setDescription] = useState(component.description || "");
  const modelId = useModelID();
  const {
    isLoading: isLoadingResources,
    isError,
    data: resources,
  } = useGetResourcesQuery(modelId);
  const { data: resourceMatchings, isLoading: isLoadingMatchings } =
    useListMatchingQuery(modelId);

  const filteredResources = resources?.filter((resource) =>
    resourceMatchings?.find(
      (match) =>
        match.resourceId === resource.id && match.componentId === component.id
    )
  );

  // Update controlled states if redux changed from outside the component
  useEffect(() => {
    setName(component.name);
  }, [component.name]);

  useEffect(() => {
    setDescription(
      component.description === undefined ? "" : component.description
    );
  }, [component.description]);

  function updateFields(newFields) {
    dispatch(
      patchComponent(component.id, {
        ...component,
        ...newFields,
      })
    );
  }

  function shouldBlur(e) {
    if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
      e.preventDefault();
      e.target.blur();
    }
  }

  return (
    <Box
      sx={{
        padding: "8px",
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" gap="20px" flexDirection="column">
              <Typography variant="h6">Properties</Typography>

              <TextField
                fullWidth
                variant="standard"
                label="Name"
                value={name}
                disabled={readOnly}
                onBlur={() => updateFields({ name })}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => shouldBlur(e)}
              />

              {type !== COMPONENT_TYPE.TRUST_BOUNDARY && (
                <TextField
                  fullWidth
                  select
                  size="small"
                  variant="standard"
                  label="Type"
                  value={type}
                  disabled={readOnly}
                  onChange={(e) => updateFields({ type: e.target.value })}
                >
                  <MenuItem value={COMPONENT_TYPE.PROCESS}>Process</MenuItem>
                  <MenuItem value={COMPONENT_TYPE.DATA_STORE}>
                    Data Store
                  </MenuItem>
                  <MenuItem value={COMPONENT_TYPE.EXTERNAL_ENTITY}>
                    External Entity
                  </MenuItem>
                  {/* Doesn't make much sense to switch to or from this component type from the others
                  <MenuItem value={COMPONENT_TYPE.TRUST_BOUNDARY}>
                    Trust Boundary
                  </MenuItem> */}
                </TextField>
              )}

              <TechStacksDropdown
                component={component}
                techStacks={classes ?? []}
                setTechStacks={(classes) => {
                  updateFields({ classes });
                }}
              />

              <MultipleSystemsDropdown
                systems={systems ?? []}
                onChange={(v) => {
                  updateFields({ systems: v });
                }}
                readOnly={readOnly}
              />
              <EditableDescription
                readOnly={readOnly}
                description={description}
                showPreviewTitle
                updateDescription={(description) =>
                  updateFields({ description })
                }
              />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" sx={{ marginBottom: "1rem" }}>
              Resources
            </Typography>
            {(isLoadingMatchings || isLoadingResources) && (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Stack spacing={1}>
                  <Typography>Loading</Typography>
                  <LinearProgress sx={{ width: "100%" }} />
                </Stack>
              </Box>
            )}
            {!isLoadingMatchings && !isLoadingResources && (
              <>
                <MatchComponentWithResource
                  modelId={modelId}
                  resources={resources}
                  component={component}
                  matchings={resourceMatchings}
                />
                {filteredResources?.length > 0 ? (
                  <ResourceList
                    isLoading={isLoadingResources}
                    isError={isError}
                    resources={filteredResources}
                  />
                ) : (
                  <Typography sx={{ marginTop: "1rem" }}>
                    No resource matched
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export function MatchComponentWithResource({
  modelId,
  component,
  resources,
  matchings,
}) {
  const [resourceInput, setResourceInput] = useState(null);
  const [createMatching] = useCreateMatchingMutation();

  const filteredResources = resources
    ? resources?.filter((r) => {
        const typeMap = {
          proc: "process",
          ds: "datastore",
          ee: "external entity",
        };
        const matchedId = matchings ? matchings?.map((m) => m.resourceId) : [];

        return (
          typeMap[component.type] === r.type.toLowerCase() &&
          !matchedId.includes(r.id)
        );
      })
    : [];

  function handleChange(e) {
    const selectedResource = resources.find((c) => c.id === e.target.value);
    createMatching({
      modelId: modelId,
      resourceId: selectedResource.id,
      componentId: component.id,
    });
    setResourceInput("");
  }

  if (filteredResources.length === 0) {
    return null;
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="match-component-select-label">
        Match with a resource
      </InputLabel>
      <Select
        id="match-resource-select-label"
        label="Match with a resource"
        fullWidth
        value={resourceInput ? resourceInput.id : null}
        onChange={handleChange}
        disabled={filteredResources.length === 0}
      >
        {filteredResources.length > 0 &&
          filteredResources.map((resource, idx) => (
            <MenuItem key={idx} value={resource.id}>
              {resource.displayName}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
