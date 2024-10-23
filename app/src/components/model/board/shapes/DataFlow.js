import { memo, useEffect, useState } from "react";
import { Arrow, Group, Rect, Text } from "react-konva";
import { useAddAnchor } from "../../hooks/useAddAnchor";
import { usePatchDataFlow } from "../../hooks/usePatchDataFlow";
import { COMPONENT_TYPE } from "../constants";
import { closestMagnets, getMagnets } from "../util";
import { Anchor } from "./Anchor";
import { useDeleteAnchor } from "../../hooks/useDeleteAnchor";

function getAnchors(points) {
  const anchors = [];
  for (let n = 2; n < points.length - 2; n += 2) {
    const x = points[n];
    const y = points[n + 1];

    anchors.push({
      key: `anchor-${n}`,
      index: n,
      x,
      y,
      draggable: true,
    });
  }

  return anchors;
}

export const DataFlow = memo(
  (props) => {
    const {
      id,
      bidirectional,
      points,
      selected,
      isEditing,
      onClick,
      getStagePointerPosition,
      label,
      labelAnchor,
    } = props;

    const [dfPoints, setDfPoints] = useState(points);
    const patchDataFlow = usePatchDataFlow(id);
    const addAnchor = useAddAnchor(id);
    const deleteAnchor = useDeleteAnchor(id);

    useEffect(() => {
      setDfPoints(points);
    }, [points]);

    // Start and end points are ALWAYS sent from parent and NEVER modified within this component
    const startComponentPos = points.slice(0, 2);
    const anchorsPos = dfPoints.slice(2, -2);
    const endComponentPos = points.slice(-2);

    const startMagnets = getMagnets(startComponentPos);
    const endMagnets = isEditing
      ? [endComponentPos]
      : getMagnets(endComponentPos);

    const magnets = closestMagnets(startMagnets, endMagnets, anchorsPos);

    // Data Flow Points adjusted to the magnets and anchors used to render the actual arrow
    const dataFlowPoints = [
      magnets[0],
      magnets[1],
      ...anchorsPos,
      magnets[2],
      magnets[3],
    ];
    const anchors = getAnchors(dataFlowPoints);
    const pointsLen = dataFlowPoints.length;

    // Calculate rotation around the magnets, to give a tiny bit of space between the magnet and the arrow
    const radius = 6;

    const dXStart = dataFlowPoints[0] - dataFlowPoints[2];
    const dYStart = dataFlowPoints[1] - dataFlowPoints[3];
    const angleStart = Math.atan2(-dYStart, dXStart);

    const dXEnd = dataFlowPoints[pointsLen - 4] - dataFlowPoints[pointsLen - 2];
    const dYEnd = dataFlowPoints[pointsLen - 3] - dataFlowPoints[pointsLen - 1];
    const angleEnd = Math.atan2(-dYEnd, dXEnd);

    dataFlowPoints[0] += -radius * Math.cos(angleStart);
    dataFlowPoints[1] += radius * Math.sin(angleStart);

    dataFlowPoints[pointsLen - 2] += radius * Math.cos(angleEnd);
    dataFlowPoints[pointsLen - 1] += -radius * Math.sin(angleEnd);

    function dragAnchorMove(e, index) {
      const { x, y } = e.target.getPosition();
      setDfPoints((prevDfPoints) => [
        ...prevDfPoints.slice(0, index),
        x,
        y,
        ...prevDfPoints.slice(index + 2),
      ]);
    }

    function dragAnchorEnd() {
      patchDataFlow({ points: dfPoints });
    }

    const labelWidth = 100;
    const labelHeight = 15;

    // This is to let ContextMenu know which component was clicked (see Board.onContextMenu)
    const clickProperties = {
      id,
      name: COMPONENT_TYPE.DATA_FLOW,
    };

    return (
      <Group
        onMouseEnter={() => (document.body.style.cursor = "pointer")}
        onMouseLeave={() => (document.body.style.cursor = "default")}
        onClick={onClick}
        {...clickProperties}
      >
        <Arrow
          {...clickProperties}
          points={dataFlowPoints}
          pointerAtBeginning={bidirectional}
          onDblClick={() => setDfPoints(addAnchor(getStagePointerPosition()))}
          fill={selected ? "#FFB3C7" : "#333"}
          stroke={selected ? "#FFB3C7" : "#333"}
          strokeWidth={1}
          hitStrokeWidth={10}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          strokeScaleEnabled={false}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
          shadowEnabled={false}
          draggable={false}
          listening={!isEditing}
        />

        {anchors
          .filter((a, i) => a.index !== labelAnchor)
          .map((props) => (
            <Anchor
              {...props}
              {...clickProperties}
              onDragMove={(e) => dragAnchorMove(e, props.index)}
              onDragEnd={() => dragAnchorEnd()}
              onDblClick={() => setDfPoints(deleteAnchor(props.index))}
              selected={selected}
            />
          ))}

        {label?.length > 0 && labelAnchor > -1 && (
          <Group
            x={dfPoints[labelAnchor]}
            y={dfPoints[labelAnchor + 1]}
            onDragMove={(e) => dragAnchorMove(e, labelAnchor)}
            onDragEnd={() => dragAnchorEnd()}
            draggable={true}
          >
            <Rect
              {...clickProperties}
              offsetX={labelWidth / 2}
              offsetY={labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              fill={"#FFFFFF"}
              cornerRadius={2}
              stroke={"#FFFFFF"}
              strokeWidth={1}
            />
            <Text
              {...clickProperties}
              text={label}
              ellipsis={true}
              offsetX={labelWidth / 2}
              offsetY={labelHeight / 2 - 2}
              fill={selected ? "#FFB3C7" : "#333"}
              width={labelWidth}
              align="center"
            />
          </Group>
        )}
      </Group>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.id !== nextProps.id ||
      prevProps.bidirectional !== nextProps.bidirectional ||
      prevProps.selected !== nextProps.selected ||
      prevProps.isEditing !== nextProps.isEditing ||
      prevProps.label !== nextProps.label ||
      prevProps.labelAnchor !== nextProps.labelAnchor ||
      !nextProps.points.every((p, i) => p === prevProps.points[i])
    ) {
      return false;
    }
    return true;
  }
);
