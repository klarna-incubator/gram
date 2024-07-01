import React from "react";
import { Circle } from "react-konva";

export function FlowMagnet(props) {
  const { display, width, onClick, x, y, id } = props;

  return (
    <Circle
      transformsEnabled="position"
      opacity={display ? 0.75 : 0.05}
      width={width}
      height={width}
      onClick={onClick}
      fill="#333"
      id={id}
      x={x}
      y={y}
      isMagnet={true} // Used by parent component (Board) to determine that a click came from this.
    />
  );
}
