import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

export function useModelID() {
  const { id: modelId } = useParams("/model/:id");
  const stateId = useSelector(({ model }) => model.id);

  // Hack: return either modelId found in params or state. Modals cant access the params for some reason.
  return modelId || stateId;
}