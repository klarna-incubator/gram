import React, { useEffect, useRef, useState } from "react";

const VISIBILITY = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
};

export const ContextMenuWrapper = React.memo(
  (props) => {
    const { open, x, y, children, stage } = props;

    const childrenRef = useRef([]);
    const [position, setPosition] = useState({ x: x, y: y });
    const [visibility, setVisibility] = useState(VISIBILITY.HIDDEN);

    // Calculate context menu position relative to the mouse pointer and menu height/width
    useEffect(() => {
      setPosition({ x: x, y: y });
      if (open) {
        let { width, height } = childrenRef.current.reduce(
          (acc, i) => {
            acc.width = Math.max(acc.width, i.offsetWidth);
            acc.height += i.offsetHeight;
            return acc;
          },
          { width: 0, height: 0 }
        );
        setPosition((prevPosition) => ({
          x:
            prevPosition.x + width >= stage.width
              ? prevPosition.x - width
              : prevPosition.x,
          y:
            prevPosition.y + height >= stage.height
              ? prevPosition.y - height
              : prevPosition.y,
        }));
        setVisibility(VISIBILITY.VISIBLE);
      }
    }, [open, stage.height, stage.width, x, y]);

    if (!open) return <></>;

    return (
      <div
        style={{ position: "absolute", zIndex: "10", visibility: visibility }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          style={{
            position: "absolute",
            top: position.y,
            left: position.x,
          }}
        >
          {React.Children.map(children, (child, index) =>
            React.cloneElement(child, {
              ref: (ref) => (childrenRef.current[index] = ref),
            })
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.open !== nextProps.open) {
      return false;
    }
    return true;
  }
);
