import { AppBar, Grow, Tab, Tabs } from "@mui/material";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";

export const TAB = {
  ALL: 0,
  MODEL: 1,
  SELECTED_COMPONENT: 2,
};

export function BottomTabsHeader({ tab, setTab }) {
  const selected = useSelectedComponent();

  // This fixes an annoying MUI console error when you deselect a component
  const tabHck = !selected && tab === TAB.COMPONENT ? TAB.SYSTEM : tab;

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
          <Tab disableRipple label="ALL" value={TAB.ALL} />
          <Tab disableRipple label="MODEL" value={TAB.MODEL} />
          {selected && (
            <Tab
              disableRipple
              label="SELECTED COMPONENT"
              value={TAB.SELECTED_COMPONENT}
            />
          )}
        </Tabs>
      </Grow>
    </AppBar>
  );
}
