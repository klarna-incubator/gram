import { useSelector } from "react-redux";

export function useComponent(componentId) {
  const { component } = useSelector(({ model }) => ({
    component: model.components.find((c) => c.id === componentId),
  }));
  return component;
}
