import { useComponentControls } from "./useComponentControls";
import { useSelectedComponent } from "./useSelectedComponent";

export function useSelectedComponentControls() {
  const component = useSelectedComponent();
  return useComponentControls(component?.id);
}
