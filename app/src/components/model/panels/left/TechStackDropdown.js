import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Paper,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useListComponentClassesQuery } from "../../../../api/gram/component-classes";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { uniqueId } from "lodash";

const componentTypes = {
  ee: "external",
  proc: "process",
  ds: "datastore",
  tb: "trust-boundary",
};

export function TechStacksDropdown({ component, techStacks, setTechStacks }) {
  const [teachStackSearch, setTechStackSearch] = useState("");
  const readOnly = useReadOnly();

  const { data: loadedTechStacks } = useListComponentClassesQuery({
    type: componentTypes[component.type],
    search: teachStackSearch,
  });
  const techStackOptions = loadedTechStacks || [];

  return (
    <Autocomplete
      autoHighlight
      fullWidth
      multiple
      disableClearable
      filterSelectedOptions
      freeSolo
      forcePopupIcon
      PaperComponent={(props) => (
        <Paper {...props} sx={{ colorScheme: (theme) => theme.palette.mode }} />
      )}
      disabled={readOnly}
      value={techStacks}
      options={techStackOptions}
      // getOptionLabel={(option) => (option.id ? option.id : option.name)}
      isOptionEqualToValue={(option, value) =>
        option.id === value.id || option.name === value.name
      }
      renderInput={(props) => (
        <TextField {...props} variant="standard" label="Tech Stack" />
      )}
      onInputChange={(_, input) => {
        setTechStackSearch(input);
      }}
      onChange={(_, values) => {
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

        const optionExists = options.some(
          (option) => inputValue.toLowerCase() === option.name.toLowerCase()
        );
        if (inputValue !== "" && !optionExists) {
          options.push({
            inputValue,
            name: `Add "${inputValue}"`,
          });
        }

        return options;
      }}
      renderOption={(props, option) => (
        <Box
          component="li"
          sx={{ "& > img": { mr: 2, flexShrink: 0 }, margin: 0 }}
          {...props}
        >
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
              setTechStacks(
                techStacks.filter(
                  (ts) => ts.id !== option.id || ts.name !== option.name
                )
              )
            }
          />
        ));
      }}
    />
  );
}
