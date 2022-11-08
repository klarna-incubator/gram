import { AppBar, Grow, Tab, Tabs } from "@mui/material";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { TAB } from "./constants";

export function LeftTabsHeader(props) {
  const { tab, setTab } = props;

  const component = useSelectedComponent();

  return (
    <AppBar position="static">
      <Grow in={true}>
        <Tabs
          value={component ? tab : TAB.SYSTEM}
          onChange={(e, v) => setTab(v)}
          textColor="inherit"
          variant="fullWidth"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: (theme) => theme.palette.common.gramPink,
            },
          }}
        >
          <Tab disableRipple label="SYSTEM" />
          {component && <Tab disableRipple label="COMPONENT" />}
        </Tabs>
      </Grow>
    </AppBar>
  );
}
