import {
  Divider,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
} from "@mui/material";
import React from "react";
import { setMultipleSelected } from "../../../../../actions/model/setSelected";
import { useAddComponent } from "../../../hooks/useAddComponent";
import { usePatchDataFlow } from "../../../hooks/usePatchDataFlow";
import {
  COMPONENT_TYPE,
  COMPONENT_SIZE,
  CONTEXT_MENU_VARIANT,
} from "../../constants";
import { ContextMenuWrapper } from "./ContextMenuWrapper";
import { useDispatch } from "react-redux";
import { getAbsolutePosition } from "../../util";

export const ContextMenu = React.memo(
  ({ open, stageDialog, x, y, stage, stageRef, onClose }) => {
    const patchDataFlow = usePatchDataFlow();
    const addComponent = useAddComponent();
    const dispatch = useDispatch();

    function onToggleBidirectional(id) {
      patchDataFlow(id, (data) => ({
        bidirectional: !data.bidirectional,
      }));
      onClose();
    }

    function onSwitchDirection(id) {
      patchDataFlow(id, (df) => ({
        startComponent: df.endComponent,
        endComponent: df.startComponent,
      }));
      onClose();
    }

    function onAddComponent(name, type) {
      const pos = getAbsolutePosition(stageRef.current, { x, y });
      const id = addComponent(
        name,
        type,
        pos.x - COMPONENT_SIZE.WIDTH / 2,
        pos.y - COMPONENT_SIZE.HEIGHT / 2
      );
      dispatch(setMultipleSelected([id]));
      onClose();
    }

    return (
      <ContextMenuWrapper open={open} x={x} y={y} stage={stage}>
        <Paper elevation={6} sx={{ width: 220, maxWidth: "100%" }}>
          <MenuList>
            {stageDialog.variant ===
              CONTEXT_MENU_VARIANT.TOGGLE_BIDIRECTIONAL && [
              <MenuItem
                key={"toggle_bidirectional"}
                onClick={() => {
                  onToggleBidirectional(stageDialog.id);
                }}
              >
                <ListItemText>Toggle bidirectional</ListItemText>
              </MenuItem>,
              <MenuItem
                key={"switch_direction"}
                onClick={() => {
                  onSwitchDirection(stageDialog.id);
                }}
              >
                <ListItemText>Switch direction</ListItemText>
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
