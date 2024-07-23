import { Drawer, Toolbar, Box, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ToggleRightPanelButton } from "../../board/components/ToggleRightPanelButton";
import { TAB } from "./constants";
import { ControlTab } from "./ControlTab";
import { SuggestionTab } from "./SuggestionTab";
import { RightTabsHeader } from "./RightTabsHeader";
import { ThreatTab } from "./ThreatTab";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponentThreats } from "../../hooks/useSelectedComponentThreats";
import { useSelectedComponentControls } from "../../hooks/useSelectedComponentControls";
import { useListMitigationsQuery } from "../../../../api/gram/mitigations";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { COMPONENT_TYPE } from "../../board/constants";

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

  const { rightPanelCollapsed } = useSelector(({ model }) => {
    return {
      rightPanelCollapsed: model.rightPanelCollapsed,
    };
  });

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
    <Box>
      <ToggleRightPanelButton />
      <Drawer
        id="panel-right"
        sx={{
          width,
          minWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width,
            minWidth,
            boxSizing: "border-box",
          },
        }}
        variant="permanent"
        anchor="right"
      >
        <Toolbar />
        {[
          COMPONENT_TYPE.DATA_STORE,
          COMPONENT_TYPE.PROCESS,
          COMPONENT_TYPE.TRUST_BOUNDARY,
        ].includes(selectedComponent?.type) || // TODO: add type for data flow? would need to migrate all data flows to have a type property
        selectedComponent?.startComponent ? (
          <>
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
          <Typography align="center" color={"#777"} marginTop={"50%"}>
            No component selected
          </Typography>
        )}
      </Drawer>
    </Box>
  );
}
