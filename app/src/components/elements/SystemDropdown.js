import { Autocomplete, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLazyListSystemsQuery } from "../../api/gram/system";

export function SystemDropdown({ value, onChange, ...props }) {
  const [options, setOptions] = useState([{ value: null, label: "No System" }]);
  const [inputValue, setInputValue] = React.useState("");

  const [listLazy, { data: result, isLoading }] = useLazyListSystemsQuery();
  const systems = result?.systems || null;

  useEffect(() => {
    if (!systems) return;
    const newOptions =
      systems.map((r) => ({
        value: r.id,
        label: r.shortName,
      })) || [];
    newOptions.push({ value: null, label: "No System" });

    setOptions(newOptions);
  }, [systems, setOptions]);

  useEffect(() => {
    if (inputValue === "") {
      return;
    }
    listLazy({
      filter: "search",
      search: inputValue,
    });
  }, [inputValue, listLazy]);

  return (
    <Autocomplete
      fullWidth
      value={value}
      onChange={(e, newValue) => {
        onChange(newValue.value);
      }}
      loading={isLoading}
      options={options}
      renderInput={(props) => (
        <TextField
          variant="standard"
          label={"System"}
          helperText={"Type to search for a system"}
          {...props}
        />
      )}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      filterSelectedOptions
      isOptionEqualToValue={(option, value) => {
        return value === option.value;
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
      {...props}
    />
  );
}
