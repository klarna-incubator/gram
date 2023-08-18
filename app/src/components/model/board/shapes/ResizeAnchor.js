import React from "react";
import { Rect } from "react-konva";

export function ResizeAnchor(props) {
  const { onDragMove } = props;

  return (
    <Rect
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
