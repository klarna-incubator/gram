import React from "react";
import { Layer, Text } from "react-konva";
import { getAbsolutePosition } from "./util";

export function DebugLayer({ lastPointerPosition, stage, stageRef }) {
  return (
    <Layer key="debug-layer">
      <Text
        x={0}
        y={0}
        width={300}
        height={1000}
        text={JSON.stringify(
          {
            lastPointerPosition,
            stage,
            abs: stageRef?.current
              ? getAbsolutePosition(stageRef?.current, {
                  x: 0,
                  y: 0,
                })
              : undefined,
          },
          null,
          4
        )}
      ></Text>
    </Layer>
  );
}
