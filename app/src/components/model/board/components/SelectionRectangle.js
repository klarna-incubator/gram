import React from "react";
import { Layer, Rect } from "react-konva";

export const SelectionRectangle = React.memo(
  (props) => {
    const { x, y, width, height, visible } = props;
    return (
      <Layer key="selection-rectangle" listening={false}>
        <Rect
          transformsEnabled="position"
          fill={"#0000FF"}
          stroke={"#0000FF"}
          opacity={0.2}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          shadowEnabled={false}
          strokeEnabled={false}
          x={x}
          y={y}
          width={width}
          height={height}
          visible={visible}
        />
      </Layer>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.width !== nextProps.width ||
      prevProps.height !== nextProps.height
    ) {
      return false;
    }
    return true;
  }
);
