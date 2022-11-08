import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { lowerCase, uniqueId } from "lodash";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { patchComponent } from "../../../../actions/model/patchComponent";
import { useListComponentClassesQuery } from "../../../../api/gram/component-classes";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { COMPONENT_TYPE } from "../../board/constants";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";

const componentTypes = {
  ee: "external",
  proc: "process",
  ds: "datastore",
};

function CustomPaper(props) {
  return <Paper {...props} sx={{ colorScheme: (theme) => theme.palette.mode }} />;
}

export function ComponentTab() {
  const dispatch = useDispatch();

  const component = useSelectedComponent();
  const readOnly = useReadOnly();

  const [name, setName] = useState(component.name);
  const [type, setType] = useState(component.type);
  const [techStacks, setTechStacks] = useState(component.classes || []);
  const [description, setDescription] = useState(component.description || "");
  const [teachStackSearch, setTechStackSearch] = useState("");

  const { data: loadedTechStacks } = useListComponentClassesQuery({
    type: componentTypes[component.type],
    search: teachStackSearch,
  });

  // Update states if redux changed from outside the component
  useEffect(() => {
    setName(component.name);
  }, [component.name]);

  useEffect(() => {
    setType(component.type);
  }, [component.type]);

  useEffect(() => {
    setTechStacks(component.classes === undefined ? [] : component.classes);
  }, [component.classes]);

  useEffect(() => {
    setDescription(component.description === undefined ? "" : component.description);
  }, [component.description]);

  // Update type
  useEffect(() => {
    if (type !== component.type) {
      updateFields();
    }
    // eslint-disable-next-line
  }, [type]);

  // Update techstacks
  useEffect(() => {
    if (JSON.stringify(techStacks) !== JSON.stringify(component.classes)) {
      updateFields();
    }
    // eslint-disable-next-line
  }, [techStacks]);

  function shouldBlur(e) {
    if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
      e.preventDefault();
      e.target.blur();
    }
  }

  function updateFields() {
    dispatch(
      patchComponent(component.id, {
        type: type,
        name: name,
        classes: techStacks,
        description: description,
      })
    );
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
                onBlur={() => updateFields()}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => shouldBlur(e)}
              />
              <TextField
                fullWidth
                select
                size="small"
                variant="standard"
                label="Type"
                value={type}
                disabled={readOnly}
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value={COMPONENT_TYPE.PROCESS}>Process</MenuItem>
                <MenuItem value={COMPONENT_TYPE.DATA_STORE}>Data store</MenuItem>
                <MenuItem value={COMPONENT_TYPE.EXTERNAL_ENTITY}>External entity</MenuItem>
              </TextField>
              <Autocomplete
                autoHighlight
                fullWidth
                multiple
                disableClearable
                filterSelectedOptions
                freeSolo
                forcePopupIcon
                PaperComponent={CustomPaper}
                disabled={readOnly}
                value={techStacks}
                options={loadedTechStacks}
                getOptionLabel={(option) => (option.id ? option.id : option.name)}
                isOptionEqualToValue={(option, value) => option.id === value.id || option.name === value.name}
                renderInput={(props) => <TextField {...props} variant="standard" label="Tech Stack" />}
                onInputChange={(e, input) => {
                  setTechStackSearch(input);
                }}
                onChange={(e, values) => {
                  setTechStacks(
                    values.map((value) =>
                      value.inputValue
                        ? {
                            id: `new-${uniqueId()}`,
                            name: value.inputValue,
                            icon: "/assets/placeholder.svg",
                            componentType: "any",
                          }
                        : value
                    )
                  );
                }}
                filterOptions={(options, params) => {
                  const { inputValue } = params;

                  const optionExists = options.some((option) => lowerCase(inputValue) === lowerCase(option.name));
                  if (inputValue !== "" && !optionExists) {
                    options.push({
                      inputValue,
                      name: `Add "${inputValue}"`,
                    });
                  }

                  return options;
                }}
                renderOption={(props, option) => (
                  <Box component="li" sx={{ "& > img": { mr: 2, flexShrink: 0 }, margin: 0 }} {...props}>
                    {option.icon && (
                      <img
                        src={option.icon}
                        width={20}
                        alt=""
                        style={{
                          objectFit: "contain",
                          borderRadius: "10%",
                        }}
                      />
                    )}
                    {option.name}
                  </Box>
                )}
                renderTags={(value, getTagProps) => {
                  return value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      avatar={
                        <Avatar
                          src={option.icon}
                          sx={{
                            "& img": { objectFit: "contain" },
                            borderRadius: "10%",
                            marginLeft: "10px !important",
                          }}
                        />
                      }
                      key={option.id}
                      label={option.name}
                      onDelete={() =>
                        setTechStacks((prevTechStack) =>
                          prevTechStack.filter((ts) => ts.id !== option.id || ts.name !== option.name)
                        )
                      }
                    />
                  ));
                }}
              />
              <TextField
                fullWidth
                multiline
                variant="standard"
                label="Description"
                disabled={readOnly}
                value={description}
                onBlur={() => updateFields()}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => shouldBlur(e)}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
