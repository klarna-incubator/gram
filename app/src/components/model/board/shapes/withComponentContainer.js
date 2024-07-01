import React, { useEffect, useRef, useState } from "react";
import { Group, Text } from "react-konva";
import { Html } from "react-konva-utils";
import { usePatchComponent } from "../../hooks/usePatchComponent";
import { COMPONENT_SIZE } from "../constants";
import { Icon } from "./Icon";
import { Magnets } from "./Magnets";
import "./withComponentContainer.css";

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
      controls,
      threats,
      mitigations,
      selected,
      draggable,
      readOnly,
      classes,
      changingComponentName,
      setChangingComponentName,
      onMagnetClick,
      onDragStart,
      onDragMove,
      onDragEnd,
      onClick,
      focusDiagramContainer,
      editDataFlow,
    } = props;

    const nameRef = useRef();
    const editNameRef = useRef();
    const patchComponent = usePatchComponent(id);
    const localWidth = width || COMPONENT_SIZE.WIDTH;
    const localHeight = height || COMPONENT_SIZE.HEIGHT;

    const [isHovered, setHovered] = useState();
    const [newName, setNewName] = useState(name);
    const [classesWithIcon, setClassesWithIcon] = useState([]);

    useEffect(() => {
      setNewName(name);
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

    function onMouseEnter() {
      document.body.style.cursor = "pointer";
      setHovered(true);
    }

    function onMouseLeave() {
      document.body.style.cursor = "default";
      setHovered(false);
    }

    function editName() {
      if (selected && !readOnly) {
        setChangingComponentName(id);
      }
    }

    function onNameKeyDown(e) {
      if (e.key === "Escape") {
        // Reset name change
        setNewName(name);
        setChangingComponentName(false);
        focusDiagramContainer();
      } else if (e.key === "Enter") {
        submitNameChange();
        setChangingComponentName(false);
        focusDiagramContainer();
      }
    }

    function submitNameChange() {
      patchComponent({ name: newName });
      setChangingComponentName(false);
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
        {includeIndicator && (
          <Icon
            url={`/assets/${indicator}`}
            id={id}
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
          type={
            type
          } /* Used to communicate upwards (onContextMenu) what type of component was clicked. */
          text={name}
          fontSize={12}
          fontFamily={"Open Sans"}
          fill={"black"}
          width={localWidth}
          align="center"
          y={localHeight / 2 - (classesWithIcon.length > 0 ? 20 : 7)}
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
                width: localWidth + "px",
              }}
              spellCheck={false}
              ref={editNameRef}
              id={id}
              type={"textarea"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
