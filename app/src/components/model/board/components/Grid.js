import React from "react";
import { Group, Layer, Line } from "react-konva";
import { getScaleLevel, scales } from "../util";
import { STAGE_ACTION } from "../constants";

export const Grid = React.memo(
  ({ width, height, x, y, scale }) => {
    // console.log("Grid", width, height, x, y, scale);
    const scaleLevel = getScaleLevel(scale);

    const denominator = Math.pow(2, scaleLevel - 1);
    const blockSize = 100 / denominator;
    const thickLine = 10 / denominator;
    const thinLine = 5 / denominator;

    const stageWidth = width / scales[scaleLevel - 1];
    const stageHeight = height / scales[scaleLevel - 1];
    const stagePosX = x / scale;
    const stagePosY = y / scale;

    const startX =
      Math.floor((-stagePosX - stageWidth) / blockSize) * blockSize;
    const endX =
      Math.floor((-stagePosX + stageWidth * 2) / blockSize) * blockSize;
    const startY =
      Math.floor((-stagePosY - stageHeight) / blockSize) * blockSize;
    const endY =
      Math.floor((-stagePosY + stageHeight * 2) / blockSize) * blockSize;

    const lines = [];
    for (let y = startY; y < endY; y += blockSize) {
      let strokeWidth =
        (y / blockSize) % 4
          ? (y / blockSize) % 2
            ? thinLine / 2
            : thinLine
          : thickLine;
      lines.push(
        <Line
          transformsEnabled="position"
          key={"h" + y}
          points={[startX, y, endX, y]}
          stroke="#efefef"
          strokeWidth={strokeWidth}
        />
      );
    }
    for (let x = startX; x < endX; x += blockSize) {
      let strokeWidth =
        (x / blockSize) % 4
          ? (x / blockSize) % 2
            ? thinLine / 2
            : thinLine
          : thickLine;
      lines.push(
        <Line
          transformsEnabled="position"
          key={"w" + x}
          points={[x, startY, x, endY]}
          stroke="#efefef"
          strokeWidth={strokeWidth}
        />
      );
    }

    return (
      <Layer key="layer-grid" listening={false}>
        <Group>{lines}</Group>
      </Layer>
    );
  },
  (prevProps, nextProps) => {
    const prevScaleLevel = getScaleLevel(prevProps.scale);
    const nextScaleLevel = getScaleLevel(nextProps.scale);

    if (prevScaleLevel !== nextScaleLevel) {
      return false;
    } else if (
      nextProps.action === STAGE_ACTION.DRAG &&
      (prevProps.x !== nextProps.x || prevProps.y !== nextProps.y)
    ) {
      return false;
    } else if (
      nextProps.action === STAGE_ACTION.RESIZE &&
      (prevProps.width !== nextProps.width ||
        prevProps.height !== nextProps.height)
    ) {
      return false;
    }
    return true;
  }
);
