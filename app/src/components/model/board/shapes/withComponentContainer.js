import React, { useEffect, useState } from "react";
import { Group } from "react-konva";
import { COMPONENT_SIZE } from "../constants";
import { ComponentLabel } from "./ComponentLabel";
import { Icon } from "./Icon";
import { Magnets } from "./Magnets";
import "./withComponentContainer.css";
import { Indicator } from "./Indicator";

const classIconHeight = 24;
const classIconPadding = 1;
const maxClassIconBarLength = 130;

async function setIcons(classes, setClassesWithIcon) {
  let totalClassIconBarLength = 0;
  let visibleClassIconBarLength = 0;
  let cls = classes || [];

  cls = cls.filter((c) => c && c.icon);
  for (let i = 0; i < cls.length; i++) {
    let img = new Image();
    img.src = cls[i].icon;
    await img.decode();

    const ratio = img.height / img.width;
    const width = classIconHeight / ratio;
    if (
      visibleClassIconBarLength + width + 2 * classIconPadding <=
      maxClassIconBarLength
    ) {
      visibleClassIconBarLength += width + 2 * classIconPadding;
    }
    totalClassIconBarLength += width + 2 * classIconPadding;
    cls[i] = {
      ...cls[i],
      image: img,
      height: classIconHeight,
      width: width,
      x: totalClassIconBarLength - width - classIconPadding,
      y: COMPONENT_SIZE.HEIGHT / 2 + classIconPadding / 2,
    };
  }
  cls = cls
    .filter((c) => {
      return c.x + c.width <= maxClassIconBarLength;
    })
    .map((c) => {
      return {
        ...c,
        x: COMPONENT_SIZE.WIDTH / 2 - visibleClassIconBarLength / 2 + c.x,
      };
    });
  setClassesWithIcon(cls);
}

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
    const [classesWithIcon, setClassesWithIcon] = useState([]);

    useEffect(() => {
      setIcons(classes, setClassesWithIcon);
    }, [classes]);

    // --------------------------------------------------------------------------
    // Event handlers
    // --------------------------------------------------------------------------

    function onMouseEnter() {
      document.body.style.cursor = "pointer";
      setHovered(true);
    }

    function onMouseLeave() {
      document.body.style.cursor = "default";
      setHovered(false);
    }

    return (
      <Group
        id={id}
        x={x}
        y={y}
        onClick={onClick}
        onMouseEnter={() => onMouseEnter()}
        onMouseLeave={() => onMouseLeave()}
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
        {classesWithIcon.map((c) => (
          <Icon
            key={c.icon}
            id={id}
            image={c.image}
            x={c.x}
            y={c.y}
            height={c.height}
            width={c.width}
          />
        ))}
        <ComponentLabel
          componentId={id}
          x={0}
          y={localHeight / 2 - (classesWithIcon.length > 0 ? 20 : 7)}
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
