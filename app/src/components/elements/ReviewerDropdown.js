import {
  Autocomplete,
  Chip,
  createFilterOptions,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useReviewersQuery } from "../../api/gram/review";

export function ReviewerDropdown({ modelId, value, onChange, anyOption }) {
  const [options, setOptions] = useState([
    { value, label: value, recommended: false },
  ]);
  const first = options.length > 0 ? options[0].value : undefined;

  const { data: reviewers, isLoading } = useReviewersQuery({
    modelId,
  });

  useEffect(() => {
    if (!reviewers) return;
    let options = reviewers
      .map((r) => ({
        value: r.sub,
        label: r.name,
        recommended: r.recommended,
      }))
      .sort(
        (a, b) =>
          // Randomize the order to get a bit more of a spread in reviewer assignment
          b.recommended + Math.random() - (a.recommended + Math.random())
      );

    if (anyOption) {
      options = [{ value: "-1", label: "Any", recommended: false }, ...options];
    }
    setOptions(options);
  }, [reviewers, setOptions, anyOption]);

  useEffect(() => {
    if ((value === undefined || value === null) && first) {
      onChange(first);
    }
  }, [value, onChange, first]);

  const filterOptions = createFilterOptions({
    matchFrom: "any",
    stringify: (option) => option.label,
    limit: 100,
  });

  return (
    <Autocomplete
      value={options.find((opt) => opt.value === value)}
      disableClearable
      filterOptions={filterOptions}
      onChange={(e, newValue) => {
        onChange(newValue.value);
      }}
      loading={isLoading}
      getOptionLabel={(option) => option.label}
      options={options}
      renderInput={(params) => (
        <FormControl sx={{ m: 1, minWidth: 250 }}>
          <InputLabel shrink={true}>Reviewer</InputLabel>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            notched={true}
            {...params}
          />
        </FormControl>
      )}
      renderOption={(props, opt) => {
        return (
          <MenuItem {...props} value={opt.value} key={opt.value}>
            {opt.label}
            {"  "}
            {opt.recommended && (
              <Chip
                label="Recommended"
                size="small"
                sx={{ marginLeft: "10px" }}
              />
            )}
          </MenuItem>
        );
      }}
    />
  );
}
