import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { COMPONENT_TYPE } from "../board/constants";

const selectSelectedComponent = createSelector(
  (state) => state.model.components,
  (state) => state.model.dataFlows,
  (state) => state.model.selected,
  (components, dataFlows, selected) => {
    const component = components.find((c) => c.id in selected);
    if (component) {
      return component;
    }
    const dataFlow = dataFlows.find((d) => d.id in selected);
    if (dataFlow) {
      return { ...dataFlow, type: COMPONENT_TYPE.DATA_FLOW }; // Hack to ensure the dataFlow object has a type property
    }
    return null;
  }
);

export function useSelectedComponent() {
  return useSelector(selectSelectedComponent);
}
