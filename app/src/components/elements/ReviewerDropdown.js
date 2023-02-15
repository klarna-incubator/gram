import { Chip, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useReviewersQuery } from "../../api/gram/review";

export function ReviewerDropdown({ modelId, value, onChange, anyOption }) {
  const [options, setOptions] = useState([]);
  const first = options.length > 0 ? options[0].value : undefined;

  const { data: reviewers } = useReviewersQuery({
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
      .sort((a, b) => b.recommended - a.recommended);

    if (anyOption) {
      options = [{ value: -1, label: "Any", recommended: false }, ...options];
    }
    setOptions(options);
  }, [reviewers, setOptions, anyOption]);

  useEffect(() => {
    if ((value === undefined || value === null) && first) {
      onChange(first);
    }
  }, [value, onChange, first]);

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel shrink={true}>Reviewer</InputLabel>
      <Select
        fullWidth
        label="Reviewer"
        size="small"
        variant="outlined"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        notched={true}
      >
        {options.map((opt) => (
          <MenuItem value={opt.value} key={opt.value}>
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
        ))}
      </Select>
    </FormControl>
  );
}
