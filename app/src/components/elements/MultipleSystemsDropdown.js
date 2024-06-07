import { Autocomplete, Chip, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLazySearchQuery } from "../../api/gram/search";
import { useLazyListSystemsQuery } from "../../api/gram/system";

export function MultipleSystemsDropdown({
  systems,
  onChange,
  multiple,
  readOnly,
  ...props
}) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = React.useState("");

  const [listLazy, { data: result, isLoading }] = useLazyListSystemsQuery();
  const [searchLazy, { data: searchResult, isLoading: searchIsLoading }] =
    useLazySearchQuery();

  const systemList = result?.systems;

  useEffect(() => {
    const newOptions = [];
    if (systemList) {
      systemList.forEach((r) =>
        newOptions.push({
          value: r.id,
          label: r.shortName,
        })
      );
    }
    if (searchResult) {
      searchResult[0].items.forEach((r) =>
        newOptions.push({
          value: r.id,
          label: r.label,
        })
      );
    }
    setOptions(newOptions);
  }, [searchResult, systemList]);

  useEffect(() => {
    if (inputValue === "") {
      return;
    }
    searchLazy({
      searchText: inputValue,
      types: ["system"],
    });
  }, [inputValue, searchLazy]);

  useEffect(() => {
    if (!systems || systems.length === 0) {
      return;
    }
    listLazy({
      filter: "batch",
      ids: systems,
    });
  }, [systems, listLazy]);

  return (
    <Autocomplete
      multiple
      autoHighlight
      fullWidth
      freeSolo
      filterSelectedOptions
      readOnly={readOnly}
      disabled={readOnly}
      value={systems.map((s) => options.find((o) => o.value === s))}
      getOptionLabel={(option) => (option.label ? option.label : option.value)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onChange={(e, newValue) => {
        onChange(newValue.map((v) => v.value));
      }}
      loading={isLoading || searchIsLoading}
      options={options}
      renderInput={(props) => (
        <TextField
          variant="standard"
          label={"System(s)"}
          helperText={"Type to search for a system"}
          {...props}
        />
      )}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      filterOptions={(x) => x}
      renderOption={(props, opt) => {
        return (
          <MenuItem {...props} value={opt.value} key={opt.value}>
            {opt.label}&nbsp;
            {opt.value && <span style={{ color: "gray" }}> ({opt.value})</span>}
          </MenuItem>
        );
      }}
      renderTags={(value, getTagProps) => {
        return value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option?.value}
            label={option?.label}
            onDelete={() =>
              onChange(systems.filter((s) => s !== option?.value))
            }
          />
        ));
      }}
      {...props}
    />
  );
}
