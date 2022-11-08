import React from "react";
import { Circle } from "react-konva";

export function Anchor(props) {
  const { onDragMove } = props;

  return (
    <Circle
      transformsEnabled="position"
      {...props}
      width={10}
      height={10}
      fill={"rgba(255, 255, 255, 0.2)"}
      stroke="#999"
      strokeWidth={0.5}
      onDragMove={onDragMove}
    />
  );
}
