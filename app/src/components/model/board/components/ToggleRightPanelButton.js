import React from "react";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  togglePanel,
  TOGGLE_RIGHT_PANEL,
} from "../../../../actions/model/togglePanel";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";

export const ToggleRightPanelButton = () => {
  const selectedComponent = useSelectedComponent();
  const dispatch = useDispatch();
  const { rightPanelCollapsed } = useSelector(({ model }) => ({
    rightPanelCollapsed: model.rightPanelCollapsed,
  }));
  // style for button attached to right panel
  let style = {
    borderRadius: "0px",
    color: "white",
    position: "relative",
    left: "-40px",
    width: "40px",
    height: "48px",
    backgroundColor: selectedComponent ? "#272727" : "#121212",
    display: "block",
    borderBottomLeftRadius: "10px",
    "&:hover": {
      backgroundColor: "#272727",
      boxShadow: "none",
    },
    "&:active": {
      boxShadow: "none",
      backgroundColor: "#272727",
    },
  };
  if (rightPanelCollapsed) {
    style = {
      ...style,
      position: "absolute",
      zIndex: 1,
      right: 0,
      left: "auto",
    };
    return (
      <Tooltip title="Show right panel">
        <IconButton
          aria-label="open drawer"
          sx={style}
          onClick={() => {
            dispatch(togglePanel(TOGGLE_RIGHT_PANEL, false));
          }}
        >
          <ArrowLeft />
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Close right panel">
      <IconButton
        aria-label="close drawer"
        sx={style}
        onClick={() => {
          dispatch(togglePanel(TOGGLE_RIGHT_PANEL, true));
        }}
      >
        <ArrowRight />
      </IconButton>
    </Tooltip>
  );
};
