import { Paper, Grow, Tab, Tabs, Badge, Typography, Box } from "@mui/material";
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
    <Paper elevation={3} sx={{ display: "flex" }}>
      <Box
        sx={{
          mx: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "0.8rem" }}>
          QUALITY CHECK
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
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
      </Box>
    </Paper>
  );
}
