import { useListControlsQuery } from "../../../../api/gram/controls";
import { useListMitigationsQuery } from "../../../../api/gram/mitigations";
import { useListThreatsQuery } from "../../../../api/gram/threats";
import { useModelID } from "../../hooks/useModelID";
import { Icon } from "./Icon";

export function Indicator({ componentId, x, y }) {
  const modelId = useModelID();
  const { data: modelThreats } = useListThreatsQuery({ modelId });
  const threats = modelThreats?.threats[componentId] || [];

  const { data: modelControls } = useListControlsQuery({ modelId });
  const controls = modelControls?.controls[componentId] || [];

  const { data: modelMitigations } = useListMitigationsQuery({ modelId });
  const mitigations = modelMitigations?.mitigations || [];

  let indicator = "unknown.svg";
  if (threats.length > 0) {
    let controlsPendingThreats = 0;
    let controlsInPlaceThreats = 0;
    for (const threat of threats) {
      const controlIds = mitigations
        ?.filter((m) => m.threatId === threat.id)
        ?.map((m) => m.controlId);

      if (
        controlIds?.length > 0 &&
        controls?.reduce(
          (p, c) => (controlIds.includes(c.id) ? c.inPlace && p : p),
          true
        )
      ) {
        controlsInPlaceThreats += 1;
      } else if (controlIds?.length > 0) {
        controlsPendingThreats += 1;
      }
    }

    if (controlsInPlaceThreats === threats.length) {
      indicator = "secure.svg";
    } else if (
      controlsInPlaceThreats + controlsPendingThreats ===
      threats.length
    ) {
      indicator = "almost-secure.svg";
    } else {
      indicator = "vulnerable.svg";
    }
  }

  return (
    <Icon url={`/assets/${indicator}`} x={x} y={y} height={16} width={16} />
  );
}
