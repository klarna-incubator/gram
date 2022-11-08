import {
  Divider,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
} from "@mui/material";
import React from "react";
import { COMPONENT_TYPE, CONTEXT_MENU_VARIANT } from "../../constants";
import { ContextMenuWrapper } from "./ContextMenuWrapper";

export const ContextMenu = React.memo(
  (props) => {
    const {
      onAddComponent,
      onToggleBidirectional,
      open,
      stageDialog,
      x,
      y,
      children,
      stage,
    } = props;
    const variant = stageDialog.variant;

    return (
      <ContextMenuWrapper
        open={open}
        x={x}
        y={y}
        children={children}
        stage={stage}
      >
        <Paper elevation={6} sx={{ width: 220, maxWidth: "100%" }}>
          <MenuList>
            {variant === CONTEXT_MENU_VARIANT.TOGGLE_BIDIRECTIONAL && [
              <MenuItem
                key={"toggle_bidirectional"}
                onClick={() => {
                  onToggleBidirectional(stageDialog.id);
                }}
              >
                <ListItemText>Toggle bidirectional</ListItemText>
              </MenuItem>,
              <Divider key={"toggle_bidirectional_divider"} />,
            ]}
            <MenuItem
              key={"add_ee"}
              onClick={() => {
                onAddComponent(
                  "External entity",
                  COMPONENT_TYPE.EXTERNAL_ENTITY
                );
              }}
            >
              <ListItemText>Add External entity</ListItemText>
            </MenuItem>
            <MenuItem
              key={"add_proc"}
              onClick={() => {
                onAddComponent("Process", COMPONENT_TYPE.PROCESS);
              }}
            >
              <ListItemText>Add Process</ListItemText>
            </MenuItem>
            <MenuItem
              key={"add_ds"}
              onClick={() => {
                onAddComponent("Data store", COMPONENT_TYPE.DATA_STORE);
              }}
            >
              <ListItemText>Add Data store</ListItemText>
            </MenuItem>
          </MenuList>
        </Paper>
      </ContextMenuWrapper>
    );
  },
  (prevProps, nextProps) => prevProps.open === nextProps.open
);
