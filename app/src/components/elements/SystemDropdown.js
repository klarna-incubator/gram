import { Autocomplete, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useLazySearchQuery } from "../../api/gram/search";

const NO_SYSTEM = { value: null, label: "No System" };

export function SystemDropdown({ value, onChange, ...props }) {
  const [inputValue, setInputValue] = useState("");
  const [searchLazy, { data: searchResult, isFetching }] = useLazySearchQuery();

  // System search was removed from GET /systems; use the generic search API.
  useEffect(() => {
    if (inputValue === "") return;
    searchLazy({ searchText: inputValue, types: ["system"] });
  }, [inputValue, searchLazy]);

  const options = useMemo(() => {
    const found = (searchResult?.[0]?.items || []).map((r) => ({
      value: r.id,
      label: r.label,
    }));
    return [...found, NO_SYSTEM];
  }, [searchResult]);

  const selected = useMemo(
    () =>
      value
        ? options.find((o) => o.value === value) || {
            value,
            label: value,
          }
        : null,
    [value, options]
  );

  return (
    <Autocomplete
      fullWidth
      autoHighlight
      value={selected}
      onChange={(e, newValue) => {
        onChange(newValue ? newValue.value : null);
      }}
      loading={isFetching}
      options={options}
      getOptionLabel={(o) => o.label ?? o.value ?? ""}
      renderInput={(params) => (
        <TextField
          variant="standard"
          label={"System"}
          helperText={"Type to search for a system"}
          {...params}
        />
      )}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      filterOptions={(x) => x}
      renderOption={(props, opt) => (
        <MenuItem {...props} value={opt.value} key={opt.value ?? "no-system"}>
          {opt.label}&nbsp;
          {opt.value && <span style={{ color: "gray" }}> ({opt.value})</span>}
        </MenuItem>
      )}
      {...props}
    />
  );
}
