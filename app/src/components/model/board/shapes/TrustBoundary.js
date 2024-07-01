import { useEffect, useRef, useState } from "react";
import { Rect, Transformer } from "react-konva";
import { usePatchComponent } from "../../hooks/usePatchComponent";
import { COMPONENT_SIZE, COMPONENT_TYPE } from "../constants";
import { ComponentLabel } from "./ComponentLabel";
import { Indicator } from "./Indicator";
import { TechStackIcons } from "./TechStackIcons";

export function TrustBoundary({
  id,
  selected,
  x,
  y,
  stage,
  name,
  width,
  height,
  draggable,
  onClick,
  onDragEnd,
  onDragMove,
  onDragStart,
  classes,
}) {
  const shapeRef = useRef();
  const trRef = useRef();
  const patchComponent = usePatchComponent(id);

  // Only using this to adjust the size of the label automatically
  const [currentInputName, setCurrentInputName] = useState(name);
  const [transforming, setTransforming] = useState(false);

  useEffect(() => {
    if (selected && trRef.current) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selected]);

  useEffect(() => {
    setCurrentInputName(name);
  }, [name]);

  const guesstimatedLabelWidth = 10 + currentInputName.length * 6;
  const labelWidth = Math.max(
    0,
    Math.min(
      width - 100,
      guesstimatedLabelWidth +
        26 * Math.max(Math.min(3, classes?.length || 0), 0)
    )
  );

  return (
    <>
      <Rect
        x={x}
        y={y}
        type={COMPONENT_TYPE.TRUST_BOUNDARY}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        draggable={draggable}
        ref={shapeRef}
        width={width}
        cornerRadius={20}
        height={height}
        dash={[3, 3]}
        fill={null}
        stroke={selected ? "#FFB3C7" : "#000000"}
        strokeWidth={2}
        onClick={onClick}
        onTransformStart={(e) => {
          setTransforming(true);
        }}
        onTransformEnd={(e) => {
          setTransforming(false);
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
            width: Math.max(COMPONENT_SIZE.WIDTH, node.width() * scaleX),
            height: Math.max(COMPONENT_SIZE.HEIGHT, node.height() * scaleY),
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

      {!transforming && (
        <>
          <Rect
            y={y - 12}
            x={x + 25}
            width={labelWidth + 50}
            height={26}
            onClick={onClick}
            stroke={"#000000"}
            strokeWidth={1}
            fill={"#FFFFFF"}
            cornerRadius={5}
          />

          <ComponentLabel
            x={x + 50}
            y={y - 5}
            componentId={id}
            width={labelWidth}
            stage={stage}
            name={name}
            align="left"
            type={COMPONENT_TYPE.TRUST_BOUNDARY}
            onChange={(name) => setCurrentInputName(name)}
          />

          <Indicator x={x + 30} y={y - 8} componentId={id} />

          <TechStackIcons
            x={x + 45 + guesstimatedLabelWidth + 24} // Bit of a hack to center the icons. Assuming here that the icons are *roughly* 26px wide.
            y={y - 11}
            classes={(classes || []).slice(0, 3)}
          />
        </>
      )}
    </>
  );
}
