import { useParams } from "react-router-dom";

export function useModelID() {
  const { id: modelId } = useParams("/model/:id");
  return modelId;
}
