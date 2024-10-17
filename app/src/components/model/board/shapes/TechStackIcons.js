import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const classIconHeight = 24;
const classIconPadding = 1;
const maxClassIconBarLength = 130;

async function setIcons(classes, setClassesWithIcon) {
  let totalClassIconBarLength = 0;

  let cls = classes || [];

  cls = cls.filter((c) => c && c.icon);
  for (let i = 0; i < cls.length; i++) {
    let img = new Image();
    img.src = cls[i].icon;

    try {
      await img.decode();
    } catch (e) {
      console.warn("Failed to load image", cls[i].icon);
      // Fall back to placeholder icon
      img = new Image();
      img.src = "/assets/placeholder.svg";
      await img.decode();
    }

    const ratio = img.height / img.width;
    const classIconWidth = classIconHeight / ratio;

    cls[i] = {
      ...cls[i],
      image: img,
      height: classIconHeight,
      width: classIconWidth,
      x: totalClassIconBarLength,
      y: classIconPadding / 2,
    };

    totalClassIconBarLength += classIconWidth + 2 * classIconPadding;
  }
  cls = cls
    .filter((c) => {
      return c.x + c.width <= maxClassIconBarLength;
    })
    .map((c) => {
      return {
        ...c,
        x: c.x,
      };
    });
  setClassesWithIcon(cls);
}

export function TechStackIcons({ classes, x, y }) {
  const [classesWithIcon, setClassesWithIcon] = useState([]);

  useEffect(() => {
    setIcons(classes, setClassesWithIcon);
  }, [classes]);

  return (
    <>
      {classesWithIcon.map((c) => (
        <Icon
          key={c.icon}
          image={c.image}
          x={x + c.x}
          y={y + c.y}
          height={c.height}
          width={c.width}
        />
      ))}
    </>
  );
}
