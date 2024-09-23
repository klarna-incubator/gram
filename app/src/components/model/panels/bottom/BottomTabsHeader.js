import { AppBar, Grow, Tab, Tabs, Badge } from "@mui/material";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";

export const TAB = {
  ALL: 0,
  MODEL: 1,
  SELECTED_COMPONENT: 2,
};

const tabBadgeStyle = {
  alignItems: "center",
  gap: "5px",
  "& span": {
    position: "relative",
    transform: "scale(1)",
  },
  fontSize: "0.6rem",
};

function getBadgeColor(length) {
  if (length === 0) {
    return "success";
  } else if (length <= 2) {
    return "warning";
  }
  return "error";
}

export function BottomTabsHeader({
  tab,
  setTab,
  allLength,
  modelLength,
  selectedLength,
}) {
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
          <Tab
            disableRipple
            label={
              <div>
                <Badge
                  showZero
                  badgeContent={allLength}
                  color={getBadgeColor(allLength)}
                  sx={tabBadgeStyle}
                >
                  ALL
                </Badge>
              </div>
            }
            value={TAB.ALL}
          />
          <Tab
            disableRipple
            label={
              <div>
                <Badge
                  showZero
                  badgeContent={modelLength}
                  color={getBadgeColor(modelLength)}
                  sx={tabBadgeStyle}
                >
                  MODEL
                </Badge>
              </div>
            }
            value={TAB.MODEL}
          />
          {selected && (
            <Tab
              disableRipple
              label={
                <div>
                  <Badge
                    showZero
                    badgeContent={selectedLength}
                    color={getBadgeColor(selectedLength)}
                    sx={tabBadgeStyle}
                  >
                    SELECTED COMPONENT
                  </Badge>
                </div>
              }
              value={TAB.SELECTED_COMPONENT}
            />
          )}
        </Tabs>
      </Grow>
    </AppBar>
  );
}
