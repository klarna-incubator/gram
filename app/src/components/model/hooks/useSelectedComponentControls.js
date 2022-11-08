import { useListControlsQuery } from "../../../api/gram/controls";
import { useModelID } from "./useModelID";
import { useSelectedComponent } from "./useSelectedComponent";

export function useSelectedComponentControls() {
  const modelId = useModelID();
  const component = useSelectedComponent();
  const { data: modelControls, isSuccess } = useListControlsQuery({ modelId });

  const controls =
    isSuccess && component ? modelControls.controls[component.id] || [] : [];

  return controls;
}
