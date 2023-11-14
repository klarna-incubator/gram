import { Slider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useMemo, useState } from "react";

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
  value,
  onChangeCommitted,
  hideDescription,
  ...props
}) {
  // Memoized to avoid issues with useEffect later. Not doing the memo means useEffect can't
  // detect it's the same marks and triggers an infinite render loop.
  const joinedMarks = useMemo(
    () =>
      marks.map((m, i) => ({
        ...(baseMarks.length > i ? baseMarks[i] : {}),
        ...m,
      })),
    [marks]
  );

  const defaultMark = joinedMarks.find((m) => m.textValue === value);
  const [mark, setMark] = useState(defaultMark);

  // Update the mark if an upstream value is updated, i.e. API value changed.
  useEffect(() => {
    const newMark = joinedMarks.find((m) => m.textValue === value);
    setMark(newMark);
  }, [joinedMarks, value]);

  return (
    <>
      <Box sx={{ paddingLeft: "30px", paddingRight: "30px" }}>
        <Slider
          value={mark.value}
          step={null} // restricts to only these steps
          marks={joinedMarks}
          min={0}
          max={4}
          valueLabelFormat={(v, i) => joinedMarks[i].label}
          onChange={(_, v) => {
            const m = joinedMarks.find((m) => m.value === v);
            setMark(m);
          }}
          onChangeCommitted={(_, v) => {
            const m = joinedMarks.find((m) => m.value === v);
            onChangeCommitted(m.textValue);
          }}
          sx={{
            color: mark?.color || "primary",
            ".MuiSlider-markLabel": {
              fontSize: "9px",
            },
            "&.Mui-disabled .MuiSlider-track": {
              color: mark?.color || "primary",
            },
          }}
          {...props}
        />
      </Box>
      {!hideDescription && mark?.description && (
        <Typography
          sx={{ whiteSpace: "pre-wrap" }}
          variant="caption"
          display="block"
          className="dimmed"
        >
          {mark?.description}
        </Typography>
      )}
    </>
  );
}
