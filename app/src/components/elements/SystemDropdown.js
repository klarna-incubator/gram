import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
} from "@mui/material";
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
      value={value}
      onChange={(e, newValue) => {
        onChange(newValue.value);
      }}
      disableClearable
      loading={isLoading}
      options={options}
      renderInput={(params) => (
        <FormControl sx={{ m: 1, minWidth: 250 }}>
          <InputLabel shrink={true}>System</InputLabel>
          <TextField fullWidth size="small" variant="outlined" {...params} />
        </FormControl>
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
            {opt.label}
          </MenuItem>
        );
      }}
      {...props}
    />
  );
}
