import { useDataFlow } from "./useDataFlow";
import { usePatchDataFlow } from "./usePatchDataFlow";

export function useDeleteAnchor(dataFlowId) {
  const patchDataFlow = usePatchDataFlow(dataFlowId);
  const dataFlow = useDataFlow(dataFlowId);

  const points = dataFlow?.points || [];
  const labelAnchor = dataFlow?.labelAnchor || -1;

  function deleteAnchor(index) {
    const newPoints = [...points.slice(0, index), ...points.slice(index + 2)];
    patchDataFlow({
      points: newPoints,
      // Correct labelAnchor index if it was after the deleted anchor
      labelAnchor: index < labelAnchor ? labelAnchor - 2 : labelAnchor,
    });
    return newPoints;
  }

  return deleteAnchor;
}
