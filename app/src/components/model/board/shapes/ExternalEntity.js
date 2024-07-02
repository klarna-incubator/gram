import { Rect } from "react-konva";
import { COMPONENT_TYPE } from "../constants";
import withComponentContainer from "./withComponentContainer";

export const ExternalEntity = withComponentContainer((props) => {
  return <Rect {...props} type={COMPONENT_TYPE.EXTERNAL_ENTITY} />;
}, COMPONENT_TYPE.EXTERNAL_ENTITY);
