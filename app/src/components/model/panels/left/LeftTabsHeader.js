import { AppBar, Grow, Tab, Tabs } from "@mui/material";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";

export const TAB = {
  SYSTEM: 0,
  ACTION_ITEMS: 1,
  COMPONENT: 2,
};

export function LeftTabsHeader({ tab, setTab }) {
  const selected = useSelectedComponent();

  // This fixes an annoying MUI console error when you deselect a component
  const tabHck = !selected && tab == TAB.COMPONENT ? TAB.SYSTEM : tab;

  return (
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
          {selected && (
            <Tab disableRipple label="COMPONENT" value={TAB.COMPONENT} />
          )}
        </Tabs>
      </Grow>
    </AppBar>
  );
}
