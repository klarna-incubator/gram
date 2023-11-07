import { useListThreatsQuery } from "../../../api/gram/threats";
import { useModelID } from "./useModelID";

export function useActionItems() {
  const modelId = useModelID();
  const { data: threats } = useListThreatsQuery({ modelId });

  const actionItems = threats?.threats
    ? Object.keys(threats?.threats)
        .map((componentId) => ({
          componentId,
          threats: threats?.threats[componentId].filter(
            (th) => th.isActionItem
          ),
        }))
        .filter(({ threats }) => threats && threats.length > 0)
    : [];

  return actionItems;
}
