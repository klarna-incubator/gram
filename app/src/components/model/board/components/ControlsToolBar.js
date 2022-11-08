import { Box, IconButton } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  changeCursorMode,
  CURSOR_PAN,
  CURSOR_POINTER,
} from "../../../../actions/model/controlsToolbarActions";
import { useDispatch, useSelector } from "react-redux";
import React from "react";

export const ControlsToolBar = (props) => {
  const { zoomInCenter } = props;

  const dispatch = useDispatch();

  let { selectedAction } = useSelector(({ model }) => ({
    selectedAction: model.cursorType,
  }));

  const buttonStyle = {
    height: "48px",
    padding: "5px",
    width: "50px",
    borderRadius: 0,
    color: "#212121",
    "&:hover": {
      backgroundColor: "#efefef",
    },
    "&.selectedAction": {
      backgroundColor: "#ececec",
      color: "#1c73e8",
    },
  };
  const containerStyle = {
    position: "absolute",
    bottom: "10px",
    left: "8px",
    height: "48px",
    width: "50%",
    maxWidth: "220px",
    backgroundColor: "#fff",
    zIndex: 2,
    boxShadow: "0px 2px 10px #05003814",
    borderRadius: "10px",
    padding: "0px 5px",
  };

  return (
    <Box sx={containerStyle}>
      <IconButton
        sx={buttonStyle}
        onClick={() => dispatch(changeCursorMode(CURSOR_POINTER))}
        className={selectedAction === CURSOR_POINTER ? "selectedAction" : ""}
      >
        <Icon icon="fa6-solid:arrow-pointer" />
      </IconButton>
      <IconButton
        sx={buttonStyle}
        onClick={() => dispatch(changeCursorMode(CURSOR_PAN))}
        className={selectedAction === CURSOR_PAN ? "selectedAction" : ""}
      >
        <Icon icon="ic:baseline-pan-tool" />
      </IconButton>
      <IconButton sx={buttonStyle} onClick={() => zoomInCenter(-1)}>
        <Icon icon="iconoir:zoom-in" />
      </IconButton>
      <IconButton sx={buttonStyle} onClick={() => zoomInCenter(1)}>
        <Icon icon="iconoir:zoom-out" />
      </IconButton>
    </Box>
  );
};
