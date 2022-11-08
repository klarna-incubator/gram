import { useSelector } from "react-redux";

export function useSelectedComponent() {
  const { component } = useSelector(({ model }) => ({
    component: model.components.find((c) => c.id in model.selected),
  }));
  return component;
}
