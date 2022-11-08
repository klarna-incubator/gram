import React, { useEffect, useRef, useState } from "react";

function getBodySize() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function drawBackground(context, width, height) {
  // Clear previous content
  context.clearRect(0, 0, width, height);

  // Fill entire canvas with background
  context.beginPath();
  context.rect(0, 0, width, height);
  context.fillStyle = "rgba(0, 0, 0, 0.6)";
  context.fill();
  context.save();
}

function drawHighlight(context, target) {
  const targetObject = document.querySelector(target);

  if (!targetObject) {
    return;
  }

  const { top, left, width, height } = targetObject.getBoundingClientRect();

  context.beginPath();
  context.rect(left, top, width, height);
  context.fillStyle = "white";
  context.fill();
}

function updateCanvas(canvasRef, highlighted, width, height) {
  if (!canvasRef.current) return;
  let context = canvasRef.current.getContext("2d");
  context.save();
  drawBackground(context, width, height);
  context.globalCompositeOperation = "destination-out";
  highlighted.forEach((h) => drawHighlight(context, h));
  context.restore();
}

const HighlightOverlay = ({ highlighted }) => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const canvasRef = useRef();
  highlighted = highlighted || [];

  useEffect(() => {
    const resizeCanvas = () => {
      const body = getBodySize();
      setWidth(body.width);
      setHeight(body.height);
    };

    // Change if window resizes
    window.addEventListener("onresize", resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener("onresize", resizeCanvas);
  }, []);

  useEffect(() => {
    updateCanvas(canvasRef, highlighted, width, height);

    // Detect if any of the elements under observation change size, in which case we can redraw the highlight
    const observer = new ResizeObserver(() =>
      updateCanvas(canvasRef, highlighted, width, height)
    );
    const elements = highlighted.map((h) => document.querySelector(h));
    elements.filter((e) => !!e).forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [highlighted, height, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        top: 0,
        left: 0,
        position: "absolute",
        zIndex: 1400,
        pointerEvents: "none",
      }}
    />
  );
};

export default HighlightOverlay;
