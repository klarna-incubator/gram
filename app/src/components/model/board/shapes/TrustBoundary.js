import { useEffect, useRef } from "react";
import { Rect, Transformer } from "react-konva";
import { usePatchComponent } from "../../hooks/usePatchComponent";
import { COMPONENT_TYPE } from "../constants";

export function TrustBoundary({
  id,
  selected,
  x,
  y,
  width,
  height,
  draggable,
  onClick,
  onDragEnd,
  onDragStart,
}) {
  const shapeRef = useRef();
  const trRef = useRef();
  const patchComponent = usePatchComponent(id);

  useEffect(() => {
    if (selected && trRef.current) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selected]);

  return (
    <>
      <Rect
        x={x}
        y={y}
        type={COMPONENT_TYPE.TRUST_BOUNDARY}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        draggable={draggable}
        ref={shapeRef}
        width={width}
        height={height}
        dash={[10, 10]}
        fill={null}
        stroke={selected ? "#FFB3C7" : "#D7BBD4"}
        strokeWidth={2}
        onClick={onClick}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          patchComponent({
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
      />
      {selected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          rotateEnabled={false}
          borderEnabled={false}
          anchorStroke={"#FFB3C7"}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (Math.abs(newBox.width) < 50 || Math.abs(newBox.height) < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
