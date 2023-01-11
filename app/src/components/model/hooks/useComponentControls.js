import { useListControlsQuery } from "../../../api/gram/controls";
import { useModelID } from "./useModelID";

export function useComponentControls(componentId) {
  const modelId = useModelID();
  const { data: modelControls, isSuccess } = useListControlsQuery({ modelId });

  const controls =
    isSuccess && !!componentId ? modelControls.controls[componentId] || [] : [];

  return controls;
}