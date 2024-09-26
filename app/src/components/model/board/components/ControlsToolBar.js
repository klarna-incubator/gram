import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import PanToolIcon from "@mui/icons-material/PanTool";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import {
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
} from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  changeCursorMode,
  CURSOR_PAN,
  CURSOR_POINTER,
} from "../../../../actions/model/controlsToolbarActions";

import {
  togglePanel,
  TOGGLE_BOTTOM_PANEL,
} from "../../../../actions/model/togglePanel";
import { AddComponentButton } from "./AddComponentButton";
import { DownloadImageButton } from "./DownloadImageButton";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useIsFramed } from "../../../../hooks/useIsFramed";

export function ControlsToolBar({ zoomInCenter, onAddComponent }) {
  const dispatch = useDispatch();

  const readOnly = useReadOnly();
  const isFramed = useIsFramed();

  let { cursorMode, bottomPanelCollapsed } = useSelector(({ model }) => ({
    cursorMode: model.cursorType,
    bottomPanelCollapsed: model.bottomPanelCollapsed,
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
      {!isFramed && (
        <ToggleButtonGroup
          value={cursorMode}
          exclusive
          onChange={(_, mode) => dispatch(changeCursorMode(mode))}
          aria-label="cursor mode"
        >
          <ToggleButton value={CURSOR_POINTER} aria-label="pointer mode">
            <Tooltip
              title={"Toggle pointer mode - allows you to select components"}
            >
              <HighlightAltIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value={CURSOR_PAN} aria-label="pan mode">
            <Tooltip
              title={
                "Toggle pan mode - allows you move the diagram. Hint: you can also hold space"
              }
            >
              <PanToolIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      )}
      <ToggleButtonGroup>
        <ToggleButton value="zoom-in" onClick={() => zoomInCenter(-1)}>
          <ZoomInIcon />
        </ToggleButton>
        <ToggleButton value="zoom-out" onClick={() => zoomInCenter(1)}>
          <ZoomOutIcon />
        </ToggleButton>
        <DownloadImageButton />
        <ToggleButton
          value="validate-model"
          onClick={() => {
            dispatch(togglePanel(TOGGLE_BOTTOM_PANEL, !bottomPanelCollapsed));
          }}
        >
          <Tooltip title={"Check the quality of your model"}>
            <FactCheckIcon />
          </Tooltip>
        </ToggleButton>

        {!readOnly && <AddComponentButton onAddComponent={onAddComponent} />}
      </ToggleButtonGroup>
    </Paper>
  );
}
