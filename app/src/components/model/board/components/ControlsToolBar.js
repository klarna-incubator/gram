import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import PanToolIcon from "@mui/icons-material/PanTool";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  changeCursorMode,
  CURSOR_PAN,
  CURSOR_POINTER,
} from "../../../../actions/model/controlsToolbarActions";
import { ScreenshotMonitor } from "@mui/icons-material";
import Konva from "konva";

// This is just a quick hack but fun little feature. The exported image is a bit janky by itself as it comes with gridlines and no background,
// but it looks ok when copied into a doc. Would be cool to make an SVG instead.
function exportImage() {
  const data = Konva.stages[0].toDataURL({ pixelRatio: 3 });
  const a = document.createElement("a");
  a.href = data;
  a.download = "Image.png";
  a.click();
}

export const ControlsToolBar = (props) => {
  const { zoomInCenter } = props;

  const dispatch = useDispatch();

  let { cursorMode } = useSelector(({ model }) => ({
    cursorMode: model.cursorType,
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        position: "absolute",
        bottom: "10px",
        left: "8px",
        zIndex: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <ToggleButtonGroup
        value={cursorMode}
        exclusive
        onChange={(_, mode) => dispatch(changeCursorMode(mode))}
        aria-label="cursor mode"
      >
        <ToggleButton value={CURSOR_POINTER} aria-label="pointer mode">
          <HighlightAltIcon />
        </ToggleButton>
        <ToggleButton value={CURSOR_PAN} aria-label="pan mode">
          <PanToolIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
        <ToggleButton value="zoom-in" onClick={() => zoomInCenter(-1)}>
          <ZoomInIcon />
        </ToggleButton>
        <ToggleButton value="zoom-out" onClick={() => zoomInCenter(1)}>
          <ZoomOutIcon />
        </ToggleButton>
        <ToggleButton>
          <ScreenshotMonitor
            value="export-image"
            onClick={() => exportImage()}
          />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
};
