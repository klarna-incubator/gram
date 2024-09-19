import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import { ValidationTab } from "./ValidationTab";
import { BottomTabsHeader, TAB } from "./BottomTabsHeader";
import { useState } from "react";

export function BottomPanel() {
  const { bottomPanelCollapsed } = useSelector(({ model }) => {
    return {
      bottomPanelCollapsed: model.bottomPanelCollapsed,
    };
  });
  const [tab, setTab] = useState(TAB.ALL);

  if (bottomPanelCollapsed) {
    return <></>;
  }
  return (
    <Box sx={{ gridArea: "bottom", backgroundColor: "rgb(40,40,40)" }}>
      <BottomTabsHeader tab={tab} setTab={setTab} />
      <ValidationTab tab={tab} setTab={setTab} />
    </Box>
  );
}
