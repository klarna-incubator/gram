import { Slider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";

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
  const joinedMarks = marks.map((m, i) => ({
    ...(baseMarks.length > i ? baseMarks[i] : {}),
    ...m,
  }));

  const defaultMark = joinedMarks.find((m) => m.textValue === value);
  const [mark, setMark] = useState(defaultMark);

  useEffect(() => {
    // Careful with joinedMarks - if set as a dependency here the useEffect loops forever.
    const upstreamMark = joinedMarks.find((m) => m.textValue === value);
    if (upstreamMark.value !== mark.value) {
      setMark(upstreamMark);
    }
  }, [value]);

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
