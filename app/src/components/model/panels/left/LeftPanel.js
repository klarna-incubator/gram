import { AppBar, Drawer, Grow, Tab, Tabs, Toolbar } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ToggleLeftPanelButton } from "../../board/components/ToggleLeftPanelButton";
import { ComponentTab } from "./ComponentTab";
import { LeftFooter } from "./Footer";
import { SystemTab } from "./SystemTab";
import { ActionItemTab } from "./ActionItemTab";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { DataFlowTab } from "./DataFlowTab";
import { useSelectedDataFlow } from "../../hooks/useSelectedDataFlow";

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
  const selectedDataflow = useSelectedDataFlow();

  const { leftPanelCollapsed } = useSelector(({ model }) => ({
    leftPanelCollapsed: model.leftPanelCollapsed,
  }));

  useEffect(() => {
    if (selectedComponent) {
      setTab(TAB.COMPONENT);
    } else if (selectedDataflow) {
      setTab(TAB.DATA_FLOW);
    } else {
      setTab(TAB.SYSTEM);
    }
  }, [selectedComponent, selectedDataflow]);

  if (leftPanelCollapsed) {
    return null;
  }

  // This fixes an annoying MUI console error when you deselect a component
  const tabHck = !selectedComponent && tab === TAB.COMPONENT ? TAB.SYSTEM : tab;

  return (
    <Box id="panel-left">
      <ToggleLeftPanelButton />
      <Drawer
        sx={{
          width: "16.6vw",
          minWidth: 310,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: "16.6vw",
            minWidth: 310,
            boxSizing: "border-box",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />

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
              <Tab
                disableRipple
                label="ACTION ITEMS"
                value={TAB.ACTION_ITEMS}
              />
              {selectedComponent && (
                <Tab disableRipple label="COMPONENT" value={TAB.COMPONENT} />
              )}
              {selectedDataflow && (
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
          {selectedComponent && <ComponentTab />}
        </TabPanel>
        <TabPanel value={tab} index={TAB.DATA_FLOW}>
          {selectedDataflow && <DataFlowTab />}
        </TabPanel>
        <LeftFooter />
      </Drawer>
    </Box>
  );
}
