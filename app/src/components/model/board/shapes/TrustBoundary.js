import { COMPONENT_TYPE } from "../constants";

import React from "react";
import { Group, Text, Rect } from "react-konva";
import { COMPONENT_SIZE } from "../constants";
import "./withComponentContainer.css";

export const TrustBoundary = (props) => {
  const { id, x, y, type, name, readOnly, selected } = props;

  return (
    <Group
      id={id}
      name={type}
      x={x}
      y={y}
      // onClick={(e) => onClick(e)}
      // onMouseEnter={() => onMouseEnter()}
      // onMouseLeave={() => onMouseLeave()}
      // onDragStart={() => onDragStart()}
      // onDragMove={(e) => onDragMove(e.target.position())}
      // onDragEnd={onDragEnd}
      draggable={true} // draggable && !selected}
    >
      <Rect
        name={COMPONENT_TYPE.TRUST_BOUNDARY}
        // fill={false}
        dash={[10, 5]}
        id={id}
        transformsEnabled="position"
        height={COMPONENT_SIZE.HEIGHT}
        width={COMPONENT_SIZE.WIDTH}
        // fill={"#000"}
        // fill={
        //   isHovered && editDataFlow && editDataFlow.startComponent.id !== id
        //     ? "#ebebeb"
        //     : "#FFF"
        // }
        stroke={selected ? "#FFB3C7" : "#D7BBD4"}
        // strokeWidth={selected ? 3 : 1}
        // hitStrokeWidth={0}
        // shadowForStrokeEnabled={false}
        // shadowFill="#D7BBD4"
        // shadowOpacity={0.2}
        // shadowBlur={5}
      />

      <Text
        // visible={changingComponentName !== id || readOnly}
        // transformsEnabled={"position"}
        // ref={nameRef}
        id={id}
        name={type}
        text={name}
        fontSize={12}
        fontFamily={"Open Sans"}
        fill={"black"}
        width={COMPONENT_SIZE.WIDTH}
        // align="center"
        padding={5}
        y={COMPONENT_SIZE.HEIGHT - 6}
        x={0}
        wrap={"none"}
        ellipsis={true}
        // onClick={() => editName()}
        onMouseEnter={() => {
          if (!readOnly) {
            document.body.style.cursor = "text";
          }
        }}
        onMouseLeave={() => {
          if (!readOnly) {
            document.body.style.cursor = "pointer";
          }
        }}
      />
    </Group>
  );
};
