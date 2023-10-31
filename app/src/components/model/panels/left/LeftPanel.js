import { Drawer, Toolbar } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ToggleLeftPanelButton } from "../../board/components/ToggleLeftPanelButton";
import { ComponentTab } from "./ComponentTab";
import { TAB } from "./constants";
import { LeftFooter } from "./Footer";
import { LeftTabsHeader } from "./LeftTabsHeader";
import { SystemTab } from "./SystemTab";
import { ActionItemList } from "./ActionItemList";
import { ActionItemTab } from "./ActionItemTab";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

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

const width = "16.6vw";
const minWidth = 310;

export function LeftPanel() {
  const [tab, setTab] = useState(TAB.SYSTEM);

  const { leftPanelCollapsed, component } = useSelector(({ model }) => ({
    component: model.components.find((c) => c.id in model.selected),
    leftPanelCollapsed: model.leftPanelCollapsed,
  }));

  useEffect(() => {
    if (!component) {
      setTab(TAB.SYSTEM);
    } else {
      setTab(TAB.COMPONENT);
    }
  }, [component]);

  return (
    <div>
      {leftPanelCollapsed === false && (
        <Box>
          <ToggleLeftPanelButton />
          <Drawer
            id="panel-left"
            sx={{
              width,
              minWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                minWidth,
                width,
                boxSizing: "border-box",
              },
            }}
            variant="permanent"
            anchor="left"
          >
            <Toolbar />
            <LeftTabsHeader tab={tab} setTab={setTab} />
            <TabPanel value={tab} index={TAB.SYSTEM}>
              <SystemTab />
            </TabPanel>
            <TabPanel value={tab} index={TAB.ACTION_ITEMS}>
              <ActionItemTab />
            </TabPanel>
            {component && (
              <TabPanel value={tab} index={TAB.COMPONENT}>
                <ComponentTab />
              </TabPanel>
            )}
            <LeftFooter />
          </Drawer>
        </Box>
      )}
    </div>
  );
}
