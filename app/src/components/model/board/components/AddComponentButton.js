import { Add } from "@mui/icons-material";
import {
  ListItemText,
  Menu,
  MenuItem,
  ToggleButton,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { COMPONENT_TYPE } from "../constants";

export function AddComponentButton({ onAddComponent }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <Menu
        id="toolbar-add-component"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem disabled>
          <Typography
            variant="body2"
            className="dimmed"
            sx={{
              width: "200px",
              wordWrap: "break-word",
              textWrap: "wrap",
              display: "block",
            }}
          >
            Hint: you can also right-click in the diagram to create a component
          </Typography>
        </MenuItem>
        <MenuItem
          key={"add_ee"}
          onClick={() => {
            onAddComponent("External entity", COMPONENT_TYPE.EXTERNAL_ENTITY);
            handleClose();
          }}
        >
          <ListItemText>Add External entity</ListItemText>
        </MenuItem>
        <MenuItem
          key={"add_proc"}
          onClick={() => {
            onAddComponent("Process", COMPONENT_TYPE.PROCESS);
            handleClose();
          }}
        >
          <ListItemText>Add Process</ListItemText>
        </MenuItem>
        <MenuItem
          key={"add_ds"}
          onClick={() => {
            onAddComponent("Data store", COMPONENT_TYPE.DATA_STORE);
            handleClose();
          }}
        >
          <ListItemText>Add Data store</ListItemText>
        </MenuItem>
      </Menu>
      <ToggleButton value="add-component" onClick={handleClick}>
        <Add value="add-component" />
      </ToggleButton>
    </>
  );
}
