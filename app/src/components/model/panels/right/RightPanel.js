import { Box, Drawer, Toolbar, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useListMitigationsQuery } from "../../../../api/gram/mitigations";
import { ToggleRightPanelButton } from "../../board/components/ToggleRightPanelButton";
import { COMPONENT_TYPE } from "../../board/constants";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { useSelectedComponentControls } from "../../hooks/useSelectedComponentControls";
import { useSelectedComponentThreats } from "../../hooks/useSelectedComponentThreats";
import { TAB } from "./constants";
import { ControlTab } from "./ControlTab";
import { RightTabsHeader } from "./RightTabsHeader";
import { SuggestionTab } from "./SuggestionTab";
import { ThreatTab } from "./ThreatTab";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      style={{
        flexGrow: value === index ? 1 : 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  );
}

var selectedTimer = null;

const width = "16.6vw";
const minWidth = 310;

export function RightPanel() {
  const [tab, setTab] = useState(TAB.THREATS);
  const [selectedId, setSelectedId] = useState(null);

  const modelId = useModelID();
  const threats = useSelectedComponentThreats();
  const controls = useSelectedComponentControls();
  const { data: mitigations } = useListMitigationsQuery({ modelId });
  const controlsMap = mitigations?.controlsMap || {};
  const selectedComponent = useSelectedComponent();

  const { rightPanelCollapsed } = useSelector(({ model }) => ({
    rightPanelCollapsed: model.rightPanelCollapsed,
  }));

  function scrollToId(id, tab) {
    setTab(tab);
    setSelectedId(id);
  }

  useEffect(() => {
    if (selectedId) {
      const selectedElement = document.getElementById(selectedId);
      selectedElement.scrollIntoView();
      clearTimeout(selectedTimer);
      selectedTimer = window.setTimeout(() => setSelectedId(null), 3000);
    }
  }, [selectedId]);

  if (rightPanelCollapsed) {
    return <></>;
  }

  return (
    <Box
      id="panel-right"
      sx={{
        gridArea: "right",
        backgroundColor: "rgb(40,40,40)",
        overflow: "auto",
      }}
    >
      {[
        COMPONENT_TYPE.DATA_STORE,
        COMPONENT_TYPE.PROCESS,
        COMPONENT_TYPE.TRUST_BOUNDARY,
        COMPONENT_TYPE.DATA_FLOW,
      ].includes(selectedComponent?.type) ? (
        <>
          <ToggleRightPanelButton />
          <RightTabsHeader tab={tab} setTab={setTab} />

          <TabPanel value={tab} index={TAB.SUGGESTIONS}>
            <SuggestionTab />
          </TabPanel>
          <TabPanel value={tab} index={TAB.THREATS}>
            <ThreatTab scrollToId={scrollToId} selectedId={selectedId} />
          </TabPanel>
          <TabPanel value={tab} index={TAB.CONTROLS}>
            <ControlTab
              threats={threats}
              controls={controls}
              controlsMap={controlsMap}
              modelId={modelId}
              componentId={selectedComponent?.id}
              scrollToId={scrollToId}
              selectedId={selectedId}
            />
          </TabPanel>
        </>
      ) : (
        <>
          <ToggleRightPanelButton />
          <Typography align="center" color={"#777"} marginTop={"50%"}>
            No component selected
          </Typography>
        </>
      )}
    </Box>
  );
}
