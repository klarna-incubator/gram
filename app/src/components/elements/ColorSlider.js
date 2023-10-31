import { Slider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";

const baseMarks = [
  {
    value: 0,
    color: "grey",
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

export function ColorSlider({
  marks,
  defaultValue,
  onChange,
  hideDescription,
  ...props
}) {
  const joinedMarks = marks.map((m, i) => ({
    ...(baseMarks.length > i ? baseMarks[i] : {}),
    ...m,
  }));

  const defaultMark = joinedMarks.find((m) => m.textValue === defaultValue);
  const [selectedMark, setSelectedMark] = useState(defaultMark);

  return (
    <>
      <Box sx={{ paddingLeft: "30px", paddingRight: "30px" }}>
        <Slider
          value={selectedMark.value}
          step={null} // restricts to only these steps
          marks={joinedMarks}
          min={0}
          max={4}
          valueLabelFormat={(v, i) => joinedMarks[i].label}
          onChange={(e) => {
            const mark = joinedMarks.find((m) => m.value === e.target.value);
            setSelectedMark(mark);
            return onChange(mark);
          }}
          sx={{
            color: selectedMark?.color || "primary",
            ".MuiSlider-markLabel": {
              fontSize: "9px",
            },
            "&.Mui-disabled .MuiSlider-track": {
              color: selectedMark?.color || "primary",
            },
          }}
          {...props}
        />
      </Box>
      {!hideDescription && selectedMark?.description && (
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
