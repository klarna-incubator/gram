import { useSelector } from "react-redux";
import { COMPONENT_TYPE } from "../board/constants";

export function useSelectedComponent() {
  const { component, dataFlow } = useSelector(({ model }) => ({
    component: model.components.find((c) => c.id in model.selected),
    dataFlow: model.dataFlows.find((d) => d.id in model.selected),
  }));

  if (component) {
    return component;
  }
  if (dataFlow) {
    return { ...dataFlow, type: COMPONENT_TYPE.DATA_FLOW }; // Hack to ensure the dataFlow object has a type property
  }

  return null;
}
