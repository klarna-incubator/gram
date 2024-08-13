import {
  Box,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { patchComponent } from "../../../../actions/model/patchComponent";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { MultipleSystemsDropdown } from "../../../elements/MultipleSystemsDropdown";
import { COMPONENT_TYPE } from "../../board/constants";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { TechStacksDropdown } from "./TechStackDropdown";
import { EditableDescription } from "../EditableDescription";

export function ComponentTab() {
  const dispatch = useDispatch();

  const component = useSelectedComponent();
  const readOnly = useReadOnly();

  const { type, classes, systems } = component;
  const [name, setName] = useState(component.name);
  const [description, setDescription] = useState(component.description || "");
  // const [type, setType] = useState(component.type);
  // const [techStacks, setTechStacks] = useState(component.classes || []);

  // const [systemId, setSystemId] = useState(component.systemId || "");

  // Update controlled states if redux changed from outside the component
  useEffect(() => {
    setName(component.name);
  }, [component.name]);

  useEffect(() => {
    setDescription(
      component.description === undefined ? "" : component.description
    );
  }, [component.description]);

  // useEffect(() => {
  //   setType(component.type);
  // }, [component.type]);

  // useEffect(() => {
  //   setTechStacks(component.classes === undefined ? [] : component.classes);
  // }, [component.classes]);

  // useEffect(() => {
  //   setSystemId(component.systemId === undefined ? "" : component.systemId);
  // }, [component.systemId]);

  function updateFields(newFields) {
    dispatch(
      patchComponent(component.id, {
        ...component,
        ...newFields,
      })
    );
  }

  function updateDescription(description) {
    updateFields({ description });
  }

  // // Update type
  // useEffect(() => {
  //   if (type !== component.type) {
  //     updateFields();
  //   }
  // }, [component.type, type]);

  // // Update techstacks
  // useEffect(() => {
  //   if (JSON.stringify(techStacks) !== JSON.stringify(component.classes)) {
  //     updateFields();
  //   }
  // }, [component.classes, techStacks]);

  // useEffect(() => {
  //   if (description !== component.description) {
  //     updateFields();
  //   }
  // }, [component.description, description]);

  // useEffect(() => {
  //   if (systemId !== component.systemId) {
  //     updateFields();
  //   }
  // }, [component.systemId, systemId]);

  function shouldBlur(e) {
    if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
      e.preventDefault();
      e.target.blur();
    }
  }
  // console.log(systems, classes);

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
                updateDescription={updateDescription}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
