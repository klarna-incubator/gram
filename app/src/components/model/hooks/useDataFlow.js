import { useSelector } from "react-redux";

export function useDataFlow(componentId) {
  const { dataflow } = useSelector(({ model }) => ({
    dataflow: model.dataFlows.find((c) => c.id === componentId),
  }));
  return dataflow;
}
