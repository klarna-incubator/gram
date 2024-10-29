import { AppBar, Grow, Tab, Tabs } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ToggleLeftPanelButton } from "../../board/components/ToggleLeftPanelButton";
import { COMPONENT_TYPE } from "../../board/constants";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { ActionItemTab } from "./ActionItemTab";
import { ComponentTab } from "./ComponentTab";
import { DataFlowTab } from "./DataFlowTab";
import { LeftFooter } from "./Footer";
import { SystemTab } from "./SystemTab";

const TAB = {
  SYSTEM: 0,
  ACTION_ITEMS: 1,
  COMPONENT: 2,
  DATA_FLOW: 3,
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lefttabpanel-${index}`}
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

export function LeftPanel() {
  const [tab, setTab] = useState(TAB.SYSTEM);

  const selectedComponent = useSelectedComponent();

  const { leftPanelCollapsed } = useSelector(({ model }) => ({
    leftPanelCollapsed: model.leftPanelCollapsed,
  }));

  const isComponent =
    selectedComponent && selectedComponent?.type !== COMPONENT_TYPE.DATA_FLOW;
  const isDataFlow =
    selectedComponent && selectedComponent?.type === COMPONENT_TYPE.DATA_FLOW;

  useEffect(() => {
    if (isComponent) {
      setTab(TAB.COMPONENT);
    } else if (isDataFlow) {
      setTab(TAB.DATA_FLOW);
    } else {
      setTab(TAB.SYSTEM);
    }
  }, [isComponent, isDataFlow]);

  if (leftPanelCollapsed) {
    return null;
  }

  // This fixes an annoying MUI console error when you deselect a component
  const tabHck = !selectedComponent && tab === TAB.COMPONENT ? TAB.SYSTEM : tab;

  return (
    <Box
      id="panel-left"
      sx={{
        gridArea: "left",
        backgroundColor: "rgb(40,40,40)",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <ToggleLeftPanelButton />

      <AppBar position="static">
        <Grow in={true}>
          <Tabs
            value={tabHck}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            variant="fullWidth"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: (theme) => theme.palette.common.gramPink,
              },
            }}
          >
            <Tab disableRipple label="SYSTEM" value={TAB.SYSTEM} />
            <Tab disableRipple label="ACTION ITEMS" value={TAB.ACTION_ITEMS} />
            {isComponent && (
              <Tab disableRipple label="COMPONENT" value={TAB.COMPONENT} />
            )}
            {isDataFlow && (
              <Tab disableRipple label="DATA FLOW" value={TAB.DATA_FLOW} />
            )}
          </Tabs>
        </Grow>
      </AppBar>

      <TabPanel value={tab} index={TAB.SYSTEM}>
        <SystemTab />
      </TabPanel>
      <TabPanel value={tab} index={TAB.ACTION_ITEMS}>
        <ActionItemTab />
      </TabPanel>
      <TabPanel value={tab} index={TAB.COMPONENT}>
        {isComponent && <ComponentTab />}
      </TabPanel>
      <TabPanel value={tab} index={TAB.DATA_FLOW}>
        {isDataFlow && <DataFlowTab />}
      </TabPanel>

      <LeftFooter />
    </Box>
  );
}
