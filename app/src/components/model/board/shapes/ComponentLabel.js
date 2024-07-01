import { useEffect, useRef, useState } from "react";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { usePatchComponent } from "../../hooks/usePatchComponent";
import { Rect, Text } from "react-konva";
import { Html } from "react-konva-utils";

export function ComponentLabel({
  x,
  y,
  name,
  maxWidth,
  componentId,
  type,
  stage,
  align = "center",
  border = false,
  expand = false,
}) {
  const readOnly = useReadOnly();
  const nameRef = useRef();
  const editNameRef = useRef();
  const patchComponent = usePatchComponent(componentId);
  const [newName, setNewName] = useState(name);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setNewName(name);
  }, [name]);

  const guesstimatedLabelWidth = 10 + newName.length * 6;
  const width = expand
    ? Math.max(0, Math.min(maxWidth, guesstimatedLabelWidth))
    : maxWidth;

  function onNameKeyDown(e) {
    if (e.key === "Escape") {
      // Reset name change
      setNewName(name);
      setEditing(false);
    } else if (e.key === "Enter") {
      patchComponent({ name: newName });
      setEditing(false);
    }
  }

  function onClick(e) {
    if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
      return; // Modifier keys are used for multi-select, so we don't want to start editing.
    }

    e.cancelBubble = true; // Prevents the event from bubbling up to component and selecting it, which would cause re-render and loss of focus.

    if (!readOnly) {
      setEditing(true);
      editNameRef.current.select();
    }
  }

  return (
    <>
      {border && (
        <Rect
          y={y}
          x={x}
          width={width + 10}
          height={22}
          //   stroke={"#000000"}
          onClick={onClick}
          fill={"#FFFFFF"}
          cornerRadius={5}
        />
      )}

      <Text
        visible={readOnly || !editing}
        transformsEnabled={"position"}
        ref={nameRef}
        type={
          type
        } /* Used to communicate upwards (onContextMenu) what type of component was clicked. */
        text={name}
        fontSize={12}
        fontFamily={"Open Sans"}
        fill={"black"}
        width={width}
        align={align}
        y={border ? y + 5 : y}
        x={border ? x + 5 : x}
        wrap={"none"}
        ellipsis={true}
        onClick={onClick}
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

      {editing && (
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
              textAlign: align,
              //   display: editing ? "block" : "none",
              width: width + "px",
            }}
            spellCheck={false}
            ref={editNameRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => onNameKeyDown(e)}
            onBlur={(e) => {
              // If mouse click or touch caused blur
              if (e.nativeEvent.sourceCapabilities) {
                patchComponent({ name: newName });
              }
              setEditing(false);
            }}
          />
        </Html>
      )}
    </>
  );
}
