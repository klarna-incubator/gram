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
