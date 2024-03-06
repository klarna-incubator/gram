import React, { useEffect, useRef, useState } from "react";
import { Group, Text } from "react-konva";
import { Html } from "react-konva-utils";
import { COMPONENT_SIZE } from "../constants";
import { getAbsolutePosition } from "../util";
import { FlowMagnet } from "./FlowMagnet";
import { Icon } from "./Icon";
import "./withComponentContainer.css";

const magnetSize = COMPONENT_SIZE.WIDTH * 0.05;
const classIconHeight = 24;
const classIconPadding = 1;
const maxClassIconBarLength = 130;

const initMagnets = (px, py, id) => {
  return [...Array(4).keys()].flatMap((side) => {
    const offsetX =
      side % 2 === 1 ? (side === 1 ? 0 : COMPONENT_SIZE.WIDTH) : 0;
    const offsetY =
      side % 2 === 0 ? (side === 0 ? 0 : COMPONENT_SIZE.HEIGHT) : 0;
    const x = side % 2 === 1 ? offsetX : offsetX + COMPONENT_SIZE.WIDTH / 2;
    const y = side % 2 === 0 ? offsetY : offsetY + COMPONENT_SIZE.HEIGHT / 2;
    return {
      key: `${id}-magnet-${side}`,
      width: magnetSize,
      height: magnetSize,
      x,
      globalX: x + px,
      globalY: y + py,
      y,
      componentId: id,
    };
  });
};

const closest = (ref, points) => {
  const res = points.reduce(
    (prev, point) => {
      const d =
        Math.pow(point.globalX - ref.x, 2) + Math.pow(point.globalY - ref.y, 2);
      return prev === undefined || d < prev.min ? { min: d, point } : prev;
    },
    { min: Number.MAX_VALUE, point: null }
  );
  return res.point;
};

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
      stage,
      controls,
      threats,
      mitigations,
      selected,
      draggable,
      readOnly,
      stageRef,
      classes,
      changingComponentName,
      setChangingComponentName,
      onDragMove,
      onMagnetClick,
      onClickP,
      onDragEnd,
      focusDiagramContainer,
      changeComponentName,
      editDataFlow,
    } = props;

    const nameRef = useRef();
    const editNameRef = useRef();

    const [isHovered, setHovered] = useState();
    const [componentName, setComponentName] = useState(name);
    const [classesWithIcon, setClassesWithIcon] = useState([]);
    const magnets = initMagnets(x, y, id);

    useEffect(() => {
      setComponentName(name);
    }, [name]);

    useEffect(() => {
      if (changingComponentName === id && editNameRef.current) {
        editNameRef.current.focus({ preventScroll: true });
        editNameRef.current.select();
      }
      // eslint-disable-next-line
    }, [changingComponentName]);

    useEffect(() => {
      setIcons(classes, setClassesWithIcon);
    }, [classes]);

    let indicator = "unknown.svg";

    if (threats) {
      let controlsPendingThreats = 0;
      let controlsInPlaceThreats = 0;
      for (const threat of threats) {
        const controlIds = mitigations
          ?.filter((m) => m.threatId === threat.id)
          ?.map((m) => m.controlId);

        if (
          controlIds?.length > 0 &&
          controls?.reduce(
            (p, c) => (controlIds.includes(c.id) ? c.inPlace && p : p),
            true
          )
        ) {
          controlsInPlaceThreats += 1;
        } else if (controlIds?.length > 0) {
          controlsPendingThreats += 1;
        }
      }

      if (controlsInPlaceThreats === threats.length) {
        indicator = "secure.svg";
      } else if (
        controlsInPlaceThreats + controlsPendingThreats ===
        threats.length
      ) {
        indicator = "almost-secure.svg";
      } else {
        indicator = "vulnerable.svg";
      }
    }

    // --------------------------------------------------------------------------
    // Event handlers
    // --------------------------------------------------------------------------

    function onClick(e) {
      e.cancelBubble = true;
      onClickP(
        e,
        closest(
          getAbsolutePosition(
            stageRef.current,
            stageRef.current.getPointerPosition()
          ),
          magnets
        )
      );
    }

    function onMouseEnter() {
      document.body.style.cursor = "pointer";
      setHovered(true);
    }

    function onMouseLeave() {
      document.body.style.cursor = "default";
      setHovered(false);
    }

    function onDragStart() {
      document.body.style.cursor = "grabbing";
    }

    function editName() {
      if (selected && !readOnly) {
        setChangingComponentName(id);
      }
    }

    function onNameKeyDown(e) {
      if (e.key === "Escape") {
        setComponentName(name);
        setChangingComponentName(false);
        focusDiagramContainer();
      } else if (e.key === "Enter") {
        submitNameChange();
        setChangingComponentName(false);
        focusDiagramContainer();
      }
    }

    function onNameChange(e) {
      setComponentName(e.target.value);
    }

    function submitNameChange() {
      changeComponentName(componentName);
      setChangingComponentName(false);
    }

    return (
      <Group
        id={id}
        name={type}
        x={x}
        y={y}
        onClick={(e) => onClick(e)}
        onMouseEnter={() => onMouseEnter()}
        onMouseLeave={() => onMouseLeave()}
        onDragStart={() => onDragStart()}
        onDragMove={(e) => onDragMove(e.target.position())}
        onDragEnd={onDragEnd}
        draggable={draggable && !selected}
      >
        <Entity
          id={id}
          transformsEnabled="position"
          height={COMPONENT_SIZE.HEIGHT}
          width={COMPONENT_SIZE.WIDTH}
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
        />
        {includeIndicator && (
          <Icon
            url={`/assets/${indicator}`}
            id={id}
            name={type}
            x={0}
            y={-20}
            height={16}
            width={16}
          />
        )}
        {classesWithIcon.map((c) => (
          <Icon
            key={c.icon}
            id={id}
            name={type}
            image={c.image}
            x={c.x}
            y={c.y}
            height={c.height}
            width={c.width}
          />
        ))}
        <Text
          visible={changingComponentName !== id || readOnly}
          transformsEnabled={"position"}
          ref={nameRef}
          id={id}
          name={type}
          text={name}
          fontSize={12}
          fontFamily={"Open Sans"}
          fill={"black"}
          width={COMPONENT_SIZE.WIDTH}
          align="center"
          y={COMPONENT_SIZE.HEIGHT / 2 - (classesWithIcon.length > 0 ? 20 : 7)}
          x={0}
          wrap={"none"}
          ellipsis={true}
          onClick={() => editName()}
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
        {changingComponentName === id && !readOnly && (
          <Html
            transform={true}
            transformFunc={(attrs) => ({
              ...attrs,
              x: nameRef.current.getAbsolutePosition().x,
              y: nameRef.current.getAbsolutePosition().y,
              scaleX: stage.scale,
              scaleY: stage.scale,
            })}
            divProps={{ veryUglyHackToForceUpdate: stage }}
          >
            <input
              className={"editComponentName"}
              style={{
                display: changingComponentName === id,
                width: COMPONENT_SIZE.WIDTH + "px",
              }}
              spellCheck={false}
              ref={editNameRef}
              id={id}
              type={"textarea"}
              value={componentName}
              onChange={(e) => onNameChange(e)}
              onKeyDown={(e) => onNameKeyDown(e)}
              onBlur={(e) => {
                // If mouse click or touch caused blur
                if (e.nativeEvent.sourceCapabilities) {
                  submitNameChange();
                }
                setChangingComponentName(false);
              }}
            />
          </Html>
        )}
        {!readOnly &&
          magnets.map((magnet) => (
            <FlowMagnet
              {...magnet}
              id={id}
              name={type}
              display={isHovered && editDataFlow.startComponent?.id !== id}
              onClick={(e) => {
                e.cancelBubble = true;
                if (e.evt.button === 0) {
                  onMagnetClick(magnet);
                }
              }}
            />
          ))}
      </Group>
    );
  };
}
