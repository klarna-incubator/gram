import React, { useState } from "react";
import { Group } from "react-konva";
import { COMPONENT_SIZE } from "../constants";
import { ComponentLabel } from "./ComponentLabel";
import { Indicator } from "./Indicator";
import { Magnets } from "./Magnets";
import { TechStackIcons } from "./TechStackIcons";

export default function withComponentContainer(Entity, type, includeIndicator) {
  // Has to be a function (not arrow) for react to play nice with hooks
  return function (props) {
    const {
      id,
      name,
      x,
      y,
      width,
      height,
      stage,
      selected,
      draggable,
      readOnly,
      classes,
      onMagnetClick,
      onDragStart,
      onDragMove,
      onDragEnd,
      onClick,
      editDataFlow,
    } = props;

    const localWidth = width || COMPONENT_SIZE.WIDTH;
    const localHeight = height || COMPONENT_SIZE.HEIGHT;

    const [isHovered, setHovered] = useState();

    return (
      <Group
        id={id}
        x={x}
        y={y}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        draggable={draggable}
      >
        <Entity
          id={id}
          transformsEnabled="position"
          height={localHeight}
          width={localWidth}
          fill={
            isHovered && editDataFlow && editDataFlow.startComponent.id !== id
              ? "#ebebeb"
              : "#FFF"
          }
          stroke={selected ? "#FFB3C7" : "#D7BBD4"}
          strokeWidth={selected ? 3 : 1}
          hitStrokeWidth={0}
          shadowForStrokeEnabled={false}
          shadowFill="#D7BBD4"
          shadowOpacity={0.2}
          shadowBlur={5}
          selected={selected}
        />
        {includeIndicator && <Indicator x={0} y={-20} componentId={id} />}
        <TechStackIcons
          x={localWidth / 2 - classes?.length * 0.5 * 26} // Bit of a hack to center the icons. Assuming here that the icons are *roughly* 26px wide.
          y={localHeight / 2 + 5}
          classes={classes}
        />
        <ComponentLabel
          componentId={id}
          x={0}
          y={localHeight / 2 - (classes?.length > 0 ? 20 : 6)}
          width={localWidth}
          type={type}
          name={name}
          stage={stage}
        />
        {!readOnly && (
          <Magnets
            x={x}
            y={y}
            id={id}
            width={localWidth}
            height={localHeight}
            display={isHovered && editDataFlow.startComponent?.id !== id}
            onMagnetClick={onMagnetClick}
          />
        )}
      </Group>
    );
  };
}
