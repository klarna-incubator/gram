import React from "react";
import { Group, Line, Rect } from "react-konva";
import { COMPONENT_TYPE } from "../constants";
import withComponentContainer from "./withComponentContainer";

export const DataStore = withComponentContainer(
  (props) => {
    const {
      fill,
      stroke,
      strokeWidth,
      shadowFill,
      shadowOpacity,
      shadowBlur,
      width,
      height,
      id,
    } = props;

    const lineProps = {
      stroke,
      strokeWidth: strokeWidth * 2,
      shadowFill,
      shadowOpacity,
      shadowBlur,
    };
    return (
      <Group>
        <Line
          transformsEnabled="position"
          points={[0, 0, width, 0]}
          id={id}
          name={COMPONENT_TYPE.DATA_STORE}
          {...lineProps}
        />
        <Line
          transformsEnabled="position"
          points={[0, height, width, height]}
          id={id}
          name={COMPONENT_TYPE.DATA_STORE}
          {...lineProps}
        />
        <Rect
          transformsEnabled="position"
          fill={fill}
          width={width}
          height={height}
          name={COMPONENT_TYPE.DATA_STORE}
          id={id}
        />
      </Group>
    );
  },
  COMPONENT_TYPE.DATA_STORE,
  true
);
