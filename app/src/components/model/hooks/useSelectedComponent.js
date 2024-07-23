import { useSelector } from "react-redux";

export function useSelectedComponent() {
  const { component, dataFlow } = useSelector(({ model }) => ({
    component: model.components.find((c) => c.id in model.selected),
    dataFlow: model.dataFlows.find((d) => d.id in model.selected),
  }));
  return component || dataFlow;
}
