import { COMPONENT_SIZE } from "./constants";

// From https://github.com/konvajs/konva/blob/master/src/Util.ts
export function getControlPoints(x0, y0, x1, y1, x2, y2, t) {
  const d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)),
    d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
    fa = (t * d01) / (d01 + d12),
    fb = (t * d12) / (d01 + d12),
    p1x = x1 - fa * (x2 - x0),
    p1y = y1 - fa * (y2 - y0),
    p2x = x1 + fb * (x2 - x0),
    p2y = y1 + fb * (y2 - y0);

  return [p1x, p1y, p2x, p2y];
}

export function getAbsolutePosition(stage, pos) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  if (pos) {
    return transform.point(pos);
  } else {
    return { x: null, y: null };
  }
}

export function lineIntersectsWithLine(line, otherLine) {
  // x1,y1 = start point, x2,y2 = end point of straight line.
  // (x1,y1) -----> (x2,y2)
  const { y1, y2, x1, x2 } = line;
  // (x3,y3) -----> (x4,y4)
  const { y1: y3, y2: y4, x1: x3, x2: x4 } = otherLine;

  if (x2 - x1 === 0) {
    if (x3 - x4 === 0) return false;
  }

  // Line is y = kx + c
  const k1 = (y2 - y1) / (x2 - x1); // if x2 == x1 => Infinty, y2 == y1 => 0 (I think ok)
  const c1 = y1 - k1 * x1;

  const k2 = (y4 - y3) / (x4 - x3);
  const c2 = y3 - k2 * x3;

  if (k1 === k2) {
    return false; // Parallel lines
  }

  // need to handle Infinity case... happens on straight line on y axis
  if (k1 === Infinity) {
    const ymin = Math.min(y3, y4);
    const ymax = Math.max(y3, y4);
    const kmin = Math.min(y1, y2);
    const kmax = Math.max(y1, y2);

    return (
      Math.min(x3, x4) <= x1 &&
      Math.max(x3, x4) >= x1 &&
      ((kmin <= ymin && ymin <= kmax) ||
        (kmin <= ymax && ymax <= kmax) ||
        (ymin <= kmin && kmin <= ymax) ||
        (ymin <= kmax && kmax <= ymax))
    );
  } else if (k2 === Infinity) {
    const ymin = Math.min(y1, y2);
    const ymax = Math.max(y1, y2);
    const kmin = Math.min(y3, y4);
    const kmax = Math.max(y3, y4);

    return (
      Math.min(x1, x2) <= x3 &&
      Math.max(x1, x2) >= x3 &&
      ((kmin <= ymin && ymin <= kmax) ||
        (kmin <= ymax && ymax <= kmax) ||
        (ymin <= kmin && kmin <= ymax) ||
        (ymin <= kmax && kmax <= ymax))
    );
  }

  /*
  Collision occurs when x = x, y = y, and always unless the line is parallel.

  y = y
  -> k1*x + c1 = k2*x + c2
  -> (k1-k2)*x = c2 - c1
  -> x = (c2 - c1) / (k1 - k2)
  */
  const xcol = (c2 - c1) / (k1 - k2);

  return (
    k1 * xcol + c1 === k2 * xcol + c2 &&
    Math.min(x1, x2) <= xcol &&
    xcol <= Math.max(x1, x2) &&
    Math.min(x3, x4) <= xcol &&
    xcol <= Math.max(x3, x4)
  );
}

/**
 * Determine if line intersects or is inside rect.
 * @param {{ x1, y1, x2, y2 }} line
 * @param {{ x1, y1, x2, y2 }} rect represented by its two corners.
 */
export function lineIntersectsWithRect(line, rect) {
  let { x1, y1, x2, y2 } = rect;

  // Min/max just to make things easier
  if (x2 < x1) {
    [x1, x2] = [x2, x1];
  }
  if (y2 < y1) {
    [y1, y2] = [y2, y1];
  }

  // Check if p1 of line is inside
  if (x1 <= line.x1 && line.x1 <= x2 && y1 <= line.y1 && line.y1 <= y2) {
    return true;
  }
  // Check if p2 of line is inside
  if (x1 <= line.x2 && line.x2 <= x2 && y1 <= line.y2 && line.y2 <= y2) {
    return true;
  }

  const lines = [
    { x1, y1, x2, y2: y1 },
    { x1, y1, x2: x1, y2 },
    { x1: x2, y1, x2, y2 },
    { x1, y1: y2, x2, y2 },
  ];

  return lines.some((l) => lineIntersectsWithLine(line, l));
}

export const scales = [0.12, 0.25, 0.5, 1.0, 1.2];

export function getScaleLevel(scale) {
  for (let i = 1; i < scales.length; i++) {
    if (scale <= scales[i]) {
      return i;
    }
  }
  return scales.length - 1;
}

export function getNormalizedScale(scale, i = 0) {
  let adjusted = getScaleLevel(scale) + i;
  if (adjusted < 0) {
    adjusted = 0;
  }
  return scales[adjusted];
}

/**
 * Gets the positions of the four "magnets" of a component. These are the connection points circles added to components
 * in the diagram that data flows connect to.
 * @param {*} param0
 * @returns
 */
export function getMagnets([x, y]) {
  return [
    [x + COMPONENT_SIZE.WIDTH / 2, y],
    [x, y + COMPONENT_SIZE.HEIGHT / 2],
    [x + COMPONENT_SIZE.WIDTH / 2, y + COMPONENT_SIZE.HEIGHT],
    [x + COMPONENT_SIZE.WIDTH, y + COMPONENT_SIZE.HEIGHT / 2],
  ];
}

/**
 * Given a dataFlow, return the two closest magnets of the start and end component.
 *
 * If the dataFlow has anchors, the closest magnets are the ones that are closest to the anchors.
 *
 * @param {*} startMagnets
 * @param {*} endMagnets
 * @param {*} anchorsPos
 * @returns
 */
export function closestMagnets(startMagnets, endMagnets, anchorsPos) {
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
  }

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

/**
 * Calculate 2D distance between two points (i.e. length of the line between the two points).
 *
 * @param {*} param0
 * @param {*} param1
 * @returns
 */
export function distance2([x1, y1], [x2, y2]) {
  const dX = x2 - x1;
  const dY = y2 - y1;
  return dX * dX + dY * dY;
}
