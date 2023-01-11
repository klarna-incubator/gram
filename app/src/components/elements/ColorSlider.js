import { Slider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";

const baseMarks = [
  {
    value: 0,
    color: "green",
  },
  {
    value: 1,
    color: "green",
  },
  {
    value: 2,
    color: "yellow",
  },
  {
    value: 3,
    color: "orange",
  },
  {
    value: 4,
    color: "red",
  },
];

export function ColorSlider({ marks, defaultValue, onChange }) {
  const joinedMarks = marks.map((m, i) => ({
    ...(baseMarks.length > i ? baseMarks[i] : {}),
    ...m,
  }));

  const defaultMark = joinedMarks.find((m) => m.value === defaultValue);
  const [selectedMark, setSelectedMark] = useState(defaultMark);

  return (
    <>
      <Box sx={{ paddingLeft: "30px", paddingRight: "30px" }}>
        <Slider
          defaultValue={defaultValue}
          step={null} // restricts to only these steps
          marks={joinedMarks}
          min={0}
          max={4}
          valueLabelDisplay="off"
          onChange={(e) => {
            setSelectedMark(
              joinedMarks.find((m) => m.value === e.target.value)
            );
            return onChange(e);
          }}
          sx={{ color: selectedMark?.color || "primary" }}
        />
      </Box>
      {selectedMark?.description && (
        <Typography
          sx={{ "white-space": "pre-wrap" }}
          variant="caption"
          display="block"
          className="dimmed"
        >
          {selectedMark?.description}
        </Typography>
      )}
    </>
  );
}