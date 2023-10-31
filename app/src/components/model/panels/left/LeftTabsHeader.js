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
          value={tab}
          onChange={(e, v) => setTab(v)}
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
          {component && (
            <Tab disableRipple label="COMPONENT" value={TAB.COMPONENT} />
          )}
        </Tabs>
      </Grow>
    </AppBar>
  );
}
