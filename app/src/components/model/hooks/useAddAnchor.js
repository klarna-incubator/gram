import { distance2 } from "../board/util";
import { useDataFlow } from "./useDataFlow";
import { usePatchDataFlow } from "./usePatchDataFlow";

export function useAddAnchor(dataFlowId) {
  const patchDataFlow = usePatchDataFlow(dataFlowId);
  const dataflow = useDataFlow(dataFlowId);
  const points = dataflow?.points || []; // Potentially wrong here as initial points should be from components.

  function createAnchor({ x, y }) {
    let min = Number.MAX_VALUE;
    let index = 0;

    // Find the closest anchor to the new anchor by finding the point that is closest to the midpoint between the new anchor and the next anchor.
    for (let n = 0; n < points.length - 2; n += 2) {
      const pX = (points[n] + points[n + 2]) / 2;
      const pY = (points[n + 1] + points[n + 3]) / 2;
      const len = distance2([x, y], [pX, pY]);
      if (len < min) {
        min = len;
        index = n;
      }
    }
    const newPoints = [
      ...points.slice(0, index + 2),
      x,
      y,
      ...points.slice(index + 2),
    ];
    const newLabelAnchor =
      index < dataflow.labelAnchor
        ? dataflow.labelAnchor + 2
        : dataflow.labelAnchor;
    patchDataFlow({ points: newPoints, labelAnchor: newLabelAnchor });
    return newPoints;
  }

  return createAnchor;
}
