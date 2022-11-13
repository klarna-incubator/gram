import { Chip, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useReviewersQuery } from "../../api/gram/review";

export function ReviewerDropdown({ modelId, value, onChange, anyOption }) {
  const [options, setOptions] = useState([]);

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
      options = [
        { value: "any", label: "Any", recommended: false },
        ...options,
      ];
    }
    setOptions(options);
  }, [reviewers, setOptions, anyOption, value]);

  const first = options.length > 0 ? options[0].value : null;

  useEffect(() => {
    if ((value === undefined || value === null) && first) {
      onChange(first);
    }
  }, [value, onChange, first]);

  return (
    <TextField
      fullWidth
      select
      size="small"
      variant="outlined"
      value={value || first}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      displayEmpty
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
    </TextField>
  );
}
