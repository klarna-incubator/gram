import { useListThreatsQuery } from "../../../api/gram/threats";
import { useModelID } from "./useModelID";
import { useSelectedComponent } from "./useSelectedComponent";

export function useSelectedComponentThreats() {
  const modelId = useModelID();
  const component = useSelectedComponent();
  const { data: modelThreats, isSuccess } = useListThreatsQuery({ modelId });

  const threats =
    isSuccess && component ? modelThreats.threats[component.id] || [] : [];

  return threats;
}
