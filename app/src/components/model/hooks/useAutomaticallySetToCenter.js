import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { COMPONENT_SIZE } from "../board/constants";

export function useAutomaticallySetToCenter(setStage, stage) {
  const [hasSet, setHas] = useState(false);

  const { components } = useSelector(({ model }) => ({
    components: model.components,
  }));

  useEffect(() => {
    if (hasSet || !components || components.length === 0 || !stage) {
      return;
    }

    setHas(true);

    // console.log("components", components);
    // console.log(stage);

    const bounds = [
      components.reduce((acc, c) => Math.min(acc, c.x - 50), Infinity),
      components.reduce((acc, c) => Math.min(acc, c.y - 50), Infinity),
      components.reduce(
        (acc, c) => Math.max(acc, c.x + COMPONENT_SIZE.WIDTH * 2),
        -Infinity
      ),
      components.reduce(
        (acc, c) => Math.max(acc, c.y + COMPONENT_SIZE.HEIGHT * 2),
        -Infinity
      ),
    ];

    // console.log("bounds", bounds);

    const containerWidth = stage.attrs.container.offsetWidth;
    const containerHeight = stage.attrs.container.offsetHeight;

    // Position of the stage, i.e. the box. It's the top left corner of the box
    const newStagePos = {
      // Tak the upper left most point and subtract for some padding
      x: bounds[0],
      y: bounds[1],
    };

    setStage((prevStage) => {
      //   console.log(containerWidth, bounds[2] - bounds[0]);
      const scale = Math.min(
        containerWidth / (bounds[2] - bounds[0]), // / 1.5, // I have no idea why this is divided by 1.5
        containerHeight / (bounds[3] - bounds[1]) // / 1.5
      );
      return {
        ...prevStage,
        ...newStagePos,
        scale,
      };
    });

    // If the app is framed, then the cursor should be set to pan mode as the diagram is simplified
  }, [hasSet, setHas, components, setStage, stage]);
}
