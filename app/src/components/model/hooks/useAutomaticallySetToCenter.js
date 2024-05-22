import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useIsFramed } from "../../../hooks/useIsFramed";
import { COMPONENT_SIZE } from "../board/constants";
import { getNormalizedScale } from "../board/util";

export function useAutomaticallySetToCenter(setStage, stage) {
  const [hasSet, setHas] = useState(false);
  const isFramed = useIsFramed();

  const { components } = useSelector(({ model }) => ({
    components: model.components,
  }));

  useEffect(() => {
    if (hasSet || !components || !stage) {
      return;
    }

    setHas(true);

    // Triggered afterward to avoid this triggering again after first component has been
    // added which would cause jank for the user
    if (components.length === 0) {
      return;
    }

    // console.log("components", components);
    // console.log(stage);

    const bounds = [
      components.reduce((acc, c) => Math.min(acc, c.x), Infinity),
      components.reduce((acc, c) => Math.min(acc, c.y), Infinity),
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
    let componentsWidth = bounds[2] - bounds[0];
    if (componentsWidth === 0) {
      componentsWidth = COMPONENT_SIZE.WIDTH * 2;
    }
    let componentsHeight = bounds[3] - bounds[1];
    if (componentsHeight === 0) {
      componentsHeight = COMPONENT_SIZE.HEIGHT * 2;
    }

    setStage((prevStage) => {
      const scale = Math.min(
        containerWidth / componentsWidth, // / 1.5, // I have no idea why this is divided by 1.5
        containerHeight / componentsHeight // / 1.5
      );

      const normalizedScale = getNormalizedScale(scale, -1);
      // console.log(scale, normalizedScale);

      // Position of the stage, i.e. the box. It's the top left corner of the box
      const newStagePos = {
        // The stage is a box containing all components. We need to this box so that the top left corner of the components
        // is close to the current top left corner of the stage
        x: (isFramed ? -bounds[0] + 40 : -bounds[0] + 100) * normalizedScale,
        y: (isFramed ? -bounds[1] + 40 : -bounds[1] + 100) * normalizedScale,
      };

      console.log(containerWidth, componentsWidth, scale, normalizedScale);

      return {
        ...prevStage,
        ...newStagePos,
        scale: normalizedScale,
      };
    });

    // If the app is framed, then the cursor should be set to pan mode as the diagram is simplified
  }, [hasSet, setHas, components, setStage, stage, isFramed]);
}
