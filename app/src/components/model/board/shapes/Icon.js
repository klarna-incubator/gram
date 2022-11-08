import React from "react";
import { Image } from "react-konva";
import useImage from "use-image";

export function Icon(props) {
  const { image, url, id, name } = props;
  let iconImage = image;
  const [imageFromUrl] = useImage(url);
  if (url) {
    iconImage = imageFromUrl;
  }
  return (
    <Image
      width={24}
      height={24}
      id={id}
      name={name}
      {...props}
      image={iconImage}
      transformsEnabled="position"
    />
  );
}
