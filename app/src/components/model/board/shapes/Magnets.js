import { COMPONENT_SIZE } from "../constants";
import { FlowMagnet } from "./FlowMagnet";

const magnetSize = COMPONENT_SIZE.WIDTH * 0.05;

export function Magnets({ px, py, id, width, height, display, onMagnetClick }) {
  // Fuckin' magnets, how do they work?
  const magnets = [...Array(4).keys()].flatMap((side) => {
    const offsetX = side % 2 === 1 ? (side === 1 ? 0 : width) : 0;
    const offsetY = side % 2 === 0 ? (side === 0 ? 0 : height) : 0;
    const x = side % 2 === 1 ? offsetX : offsetX + width / 2;
    const y = side % 2 === 0 ? offsetY : offsetY + height / 2;

    return {
      key: `${id}-magnet-${side}`,
      width: magnetSize,
      height: magnetSize,
      x,
      globalX: x + px,
      globalY: y + py,
      y,
      componentId: id,
    };
  });

  return magnets.map((magnet) => (
    <FlowMagnet
      {...magnet}
      id={id}
      display={display}
      onClick={(e) => {
        e.cancelBubble = true;
        onMagnetClick(magnet);
      }}
    />
  ));
}
