import React from "react";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  togglePanel,
  TOGGLE_LEFT_PANEL,
} from "../../../../actions/model/togglePanel";

export const ToggleLeftPanelButton = () => {
  const dispatch = useDispatch();
  const { leftPanelCollapsed } = useSelector(({ model }) => ({
    leftPanelCollapsed: model.leftPanelCollapsed,
  }));
  // style for button attached to left panel
  let style = {
    borderRadius: "0px",
    color: "white",
    position: "relative",
    right: "-40px",
    top: "64px",
    width: "40px",
    height: "48px",
    backgroundColor: "#272727",
    display: "block",
    float: "right",
    zIndex: 1,
    borderBottomRightRadius: "10px",
    "&:hover": {
      backgroundColor: "#121212",
      boxShadow: "none",
    },
    "&:active": {
      boxShadow: "none",
      backgroundColor: "#121212",
    },
  };
  if (leftPanelCollapsed) {
    style = {
      ...style,
      position: "absolute",
      zIndex: 1,
      left: 0,
      right: "auto",
    };
    return (
      <Tooltip title="Show left panel">
        <IconButton
          aria-label="open drawer"
          sx={style}
          onClick={() => {
            dispatch(togglePanel(TOGGLE_LEFT_PANEL, false));
          }}
        >
          <ArrowRight />
        </IconButton>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip title="Close left panel">
        <IconButton
          aria-label="close drawer"
          sx={style}
          onClick={() => {
            dispatch(togglePanel(TOGGLE_LEFT_PANEL, true));
          }}
        >
          <ArrowLeft />
        </IconButton>
      </Tooltip>
    );
  }
};
