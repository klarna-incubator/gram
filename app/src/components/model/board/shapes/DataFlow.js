import { memo, useEffect, useState } from "react";
import { Arrow, Circle, Group, Rect, Text } from "react-konva";
import { useDispatch } from "react-redux";
import { patchDataFlow } from "../../../../actions/model/patchDataFlow";
import { COMPONENT_SIZE, COMPONENT_TYPE } from "../constants";
import { Anchor } from "./Anchor";
import { ComponentLabel } from "./ComponentLabel";

function getMagnets([x, y]) {
  return [
    [x + COMPONENT_SIZE.WIDTH / 2, y],
    [x, y + COMPONENT_SIZE.HEIGHT / 2],
    [x + COMPONENT_SIZE.WIDTH / 2, y + COMPONENT_SIZE.HEIGHT],
    [x + COMPONENT_SIZE.WIDTH, y + COMPONENT_SIZE.HEIGHT / 2],
  ];
}

function distance2([x1, y1], [x2, y2]) {
  const dX = x2 - x1;
  const dY = y2 - y1;
  return dX * dX + dY * dY;
}

function closestMagnets(startMagnets, endMagnets, anchorsPos) {
  if (anchorsPos.length > 0) {
    const startMagnet = startMagnets.reduce(
      (accStart, magnetStart) => {
        const len = distance2(magnetStart, anchorsPos.slice(0, 2));
        return len < accStart[1] ? [magnetStart, len] : accStart;
      },
      [null, Number.MAX_VALUE]
    )[0];

    const endMagnet = endMagnets.reduce(
      (accEnd, magnetEnd) => {
        const len = distance2(magnetEnd, anchorsPos.slice(-2));
        return len < accEnd[1] ? [magnetEnd, len] : accEnd;
      },
      [null, Number.MAX_VALUE]
    )[0];
    return [...startMagnet, ...endMagnet];
  } else {
    return startMagnets.reduce(
      (accStart, magnetStart) => {
        const partialMin = endMagnets.reduce(
          (accEnd, magnetEnd) => {
            const len = distance2(magnetStart, magnetEnd);
            return len < accEnd[1] ? [magnetEnd, len] : accEnd;
          },
          [null, Number.MAX_VALUE]
        );
        return partialMin[1] < accStart[1]
          ? [[...magnetStart, ...partialMin[0]], partialMin[1]]
          : accStart;
      },
      [null, Number.MAX_VALUE]
    )[0];
  }
}

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
    } = props;

    const dispatch = useDispatch();
    const [dfPoints, setDfPoints] = useState(points);

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

    const dataFlowPoints = [
      magnets[0],
      magnets[1],
      ...anchorsPos,
      magnets[2],
      magnets[3],
    ];
    const anchors = getAnchors(dataFlowPoints);
    const pointsLen = dataFlowPoints.length;

    // Calculate rotation around the magnets
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

    function createAnchor() {
      const { x, y } = getStagePointerPosition();

      let min = Number.MAX_VALUE;
      let index = 0;
      for (let n = 0; n < dataFlowPoints.length - 2; n += 2) {
        const pX = (dataFlowPoints[n] + dataFlowPoints[n + 2]) / 2;
        const pY = (dataFlowPoints[n + 1] + dataFlowPoints[n + 3]) / 2;
        const len = distance2([x, y], [pX, pY]);
        if (len < min) {
          min = len;
          index = n;
        }
      }

      const newPoints = [
        ...dfPoints.slice(0, index + 2),
        x,
        y,
        ...dfPoints.slice(index + 2),
      ];
      dispatch(patchDataFlow(id, { points: newPoints }));
      setDfPoints(newPoints);
    }

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
      dispatch(patchDataFlow(id, { points: dfPoints }));
    }

    function deleteAnchor(index) {
      const newPoints = [
        ...dfPoints.slice(0, index),
        ...dfPoints.slice(index + 2),
      ];
      dispatch(patchDataFlow(id, { points: newPoints }));
      setDfPoints(newPoints);
    }

    const labelWidth = 100;
    const labelHeight = 15;

    let labelX = (dataFlowPoints[0] + dataFlowPoints[2]) / 2;
    let labelY = (dataFlowPoints[1] + dataFlowPoints[3]) / 2;

    if ((dataFlowPoints.length / 2) % 2 === 1) {
      labelX = dataFlowPoints[dataFlowPoints.length / 2 - 1];
      labelY = dataFlowPoints[dataFlowPoints.length / 2];
    }

    const rotation =
      (Math.atan2(
        dataFlowPoints[pointsLen - 3] - dataFlowPoints[pointsLen - 1],
        dataFlowPoints[pointsLen - 4] - dataFlowPoints[pointsLen - 2]
      ) /
        Math.PI /
        2) *
      360;

    return (
      <Group
        onMouseEnter={() => (document.body.style.cursor = "pointer")}
        onMouseLeave={() => (document.body.style.cursor = "default")}
        onClick={(e) => onClick(e)}
      >
        <Arrow
          id={id}
          name={COMPONENT_TYPE.DATA_FLOW}
          points={dataFlowPoints}
          pointerAtBeginning={bidirectional}
          onDblClick={() => createAnchor()}
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
        {anchors.map((props) => (
          <Anchor
            {...props}
            id={id}
            name={COMPONENT_TYPE.DATA_FLOW}
            onDragMove={(e) => dragAnchorMove(e, props.index)}
            onDragEnd={() => dragAnchorEnd()}
            onDblClick={() => deleteAnchor(props.index)}
            selected={selected}
          />
        ))}

        {label?.length > 0 && (
          <>
            <Rect
              x={labelX}
              y={labelY}
              rotation={rotation}
              offsetX={labelWidth / 2}
              offsetY={labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              fill={"#FFFFFF"}
              cornerRadius={2}
              stroke="#333"
              strokeWidth={1}
            />

            <Text
              text={label}
              ellipsis={true}
              x={labelX}
              y={labelY + 2}
              offsetX={labelWidth / 2}
              offsetY={labelHeight / 2}
              rotation={Math.abs(rotation) > 90 ? rotation + 180 : rotation}
              width={labelWidth}
              align="center"
            />
          </>
        )}

        {/* <ComponentLabel
          x={labelX}
          y={labelY}
          rotation={rotation}
          name={label}
          width={labelWidth}
        /> */}

        {/* <Circle
          x={labelX}
          y={labelY}
          radius={3}
          fill={"#333"}
          stroke={"#333"}
          strokeWidth={1}
        /> */}
      </Group>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.id !== nextProps.id ||
      prevProps.bidirectional !== nextProps.bidirectional ||
      prevProps.selected !== nextProps.selected ||
      prevProps.isEditing !== nextProps.isEditing ||
      !nextProps.points.every((p, i) => p === prevProps.points[i])
    ) {
      return false;
    }
    return true;
  }
);
