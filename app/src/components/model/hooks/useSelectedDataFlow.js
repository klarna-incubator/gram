import { useSelector } from "react-redux";

export function useSelectedDataFlow() {
  const { dataFlow } = useSelector(({ model }) => ({
    dataFlow: model.dataFlows.find((d) => d.id in model.selected),
  }));
  return dataFlow;
}
