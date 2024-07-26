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
import { useDispatch, useSelector } from "react-redux";
import { getAbsolutePosition } from "../../util";

export function ContextMenu({
  open,
  stageDialog,
  x,
  y,
  stage,
  stageRef,
  onClose,
}) {
  const patchDataFlow = usePatchDataFlow(stageDialog.id);
  const addComponent = useAddComponent();
  const dispatch = useDispatch();
  const { dataFlow } = useSelector(({ model }) => ({
    dataFlow: model.dataFlows.find((d) => d.id === stageDialog.id),
  }));

  function onToggleBidirectional() {
    patchDataFlow({
      bidirectional: !dataFlow?.bidirectional,
    });
    onClose();
  }

  function onSwitchDirection() {
    patchDataFlow({
      startComponent: dataFlow.endComponent,
      endComponent: dataFlow.startComponent,
    });
    onClose();
  }

  function onAddComponent(name, type) {
    const pos = getAbsolutePosition(stageRef.current, { x, y });
    const id = addComponent({
      name,
      type,
      x: pos.x - COMPONENT_SIZE.WIDTH / 2,
      y: pos.y - COMPONENT_SIZE.HEIGHT / 2,
    });
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
              onClick={onToggleBidirectional}
            >
              <ListItemText>Toggle bidirectional</ListItemText>
            </MenuItem>,
            !dataFlow?.bidirectional ? (
              <MenuItem key={"switch_direction"} onClick={onSwitchDirection}>
                <ListItemText>Switch direction</ListItemText>
              </MenuItem>
            ) : null,
            <Divider key={"toggle_bidirectional_divider"} />,
          ]}
          <MenuItem
            key={"add_ee"}
            onClick={() => {
              onAddComponent("External entity", COMPONENT_TYPE.EXTERNAL_ENTITY);
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
              onAddComponent("Data Store", COMPONENT_TYPE.DATA_STORE);
            }}
          >
            <ListItemText>Add Data Store</ListItemText>
          </MenuItem>
          <MenuItem
            key={"add_tb"}
            onClick={() => {
              onAddComponent("Trust Boundary", COMPONENT_TYPE.TRUST_BOUNDARY);
            }}
          >
            <ListItemText>Add Trust Boundary</ListItemText>
          </MenuItem>
        </MenuList>
      </Paper>
    </ContextMenuWrapper>
  );
}
