import React from "react";
import { Ellipse } from "react-konva";
import { COMPONENT_TYPE } from "../constants";
import withComponentContainer from "./withComponentContainer";

export const Process = withComponentContainer(
  (props) => {
    const { width, height } = props;
    return (
      <Ellipse
        transformsEnabled="position"
        {...props}
        x={width / 2}
        y={height / 2}
        radiusX={width / 2}
        radiusY={height / 2}
        name={COMPONENT_TYPE.PROCESS}
      />
    );
  },
  COMPONENT_TYPE.PROCESS,
  true
);
