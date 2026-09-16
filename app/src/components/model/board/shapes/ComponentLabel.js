import { useCallback, useEffect, useState } from "react";
import { Text } from "react-konva";
import { Html } from "react-konva-utils";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { usePatchComponent } from "../../hooks/usePatchComponent";

export function ComponentLabel({
  x,
  y,
  name,
  width,
  componentId,
  type,
  align = "center",
  onChange,
  onClick,
}) {
  const readOnly = useReadOnly();
  const patchComponent = usePatchComponent(componentId);
  const [newName, setNewName] = useState(name);
  const [editing, setEditing] = useState(false);

  // The input below is rendered into a separate React root by <Html>, which
  // mounts it a microtask after the click handler returns — so there is no
  // point at which the handler can select it directly. A callback ref selects
  // the text at the moment the input actually attaches.
  const selectOnMount = useCallback((input) => input?.select(), []);

  useEffect(() => {
    setNewName(name);
  }, [name]);

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

  function onLocalClick(e) {
    if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey || readOnly) {
      return; // Modifier keys are used for multi-select, so we don't want to start editing.
    }

    onClick && onClick(e);
    e.cancelBubble = true; // Prevents the event from bubbling up to component and selecting it, which would cause re-render and loss of focus.
    setEditing(true);
  }

  return (
    <>
      <Text
        visible={readOnly || !editing}
        transformsEnabled={"position"}
        type={
          type
        } /* Used to communicate upwards (onContextMenu) what type of component was clicked. */
        text={name}
        fontSize={12}
        fontFamily={"Open Sans"}
        fill={"black"}
        width={width}
        align={align}
        y={y}
        x={x}
        wrap={"none"}
        ellipsis={true}
        onClick={onLocalClick}
      />

      {editing && (
        <Html>
          <input
            className={"editComponentName"}
            style={{
              width: width + "px",
              position: "absolute",
              top: y - 4,
              left: x,
              border: "none",
              fontSize: "12px",
              padding: "0px",
              margin: "0px",
              overflow: "hidden",
              background: "none",
              outline: "none",
              resize: "none",
              lineHeight: 1,
              fontFamily: "Open Sans",
              transformOrigin: "left top",
              textAlign: "center",
              color: "black",
            }}
            spellCheck={false}
            ref={selectOnMount}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              onChange && onChange(e.target.value);
            }}
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
