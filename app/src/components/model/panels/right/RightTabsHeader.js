import { AppBar, Badge, Grow, Tab, Tabs } from "@mui/material";
import { useListMitigationsQuery } from "../../../../api/gram/mitigations";
import { useListSuggestionsQuery } from "../../../../api/gram/suggestions";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { useSelectedComponentControls } from "../../hooks/useSelectedComponentControls";
import { useSelectedComponentThreats } from "../../hooks/useSelectedComponentThreats";
import { TAB } from "./constants";

const tabBadgeStyle = {
  alignItems: "center",
  gap: "5px",
  "& span": {
    position: "relative",
    transform: "scale(1)",
  },
  fontSize: "0.6rem",
};

export function RightTabsHeader(props) {
  const { tab, setTab } = props;

  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const { data: mitigations } = useListMitigationsQuery({ modelId });
  const threatsMap = mitigations?.threatsMap || {};

  const { data: suggestions } = useListSuggestionsQuery(modelId);
  const threatSuggestions = (
    suggestions?.threatsMap[selectedComponent.id] || []
  )
    // Hack for now to remove repetitive stride suggestions from the list.
    // Will address this later as we do a major update to how suggestions work.
    .filter((s) => s.source !== "stride");
  const controlSuggestions =
    suggestions?.controlsMap[selectedComponent.id] || [];
  const nSuggestions =
    controlSuggestions.filter((t) => t.status === "new").length +
    threatSuggestions.filter((t) => t.status === "new").length;

  const suggestionColor = nSuggestions > 0 ? "warning" : "success";

  const threats = useSelectedComponentThreats();
  const controls = useSelectedComponentControls();

  let controlsPendingThreats = 0;
  let controlsInPlaceThreats = 0;
  threats.map((t) => {
    const controlIds = threatsMap[t.id];
    if (
      controlIds?.length > 0 &&
      controls?.reduce(
        (p, c) => (controlIds.includes(c.id) ? c.inPlace && p : p),
        true
      )
    ) {
      controlsInPlaceThreats += 1;
      return {
        ...t,
        mitigated: true,
      };
    } else if (controlIds?.length > 0) {
      controlsPendingThreats += 1;
      return {
        ...t,
        mitigated: false,
      };
    } else {
      return {
        ...t,
        mitigated: null,
      };
    }
  });

  let threatColor = "info";
  if (controlsInPlaceThreats > 0 && controlsInPlaceThreats === threats.length) {
    threatColor = "success";
  } else if (
    controlsInPlaceThreats + controlsPendingThreats ===
    threats.length
  ) {
    threatColor = "warning";
  } else {
    threatColor = "error";
  }

  let controlColor = "warning";
  const inPlaceControls = controls.reduce(
    (p, c) => (c.inPlace === true ? p + 1 : p),
    0
  );
  if (inPlaceControls > 0 && inPlaceControls === controls.length) {
    controlColor = "success";
  }

  return (
    <AppBar position="static" id="panel-right-header">
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
          <Tab
            value={TAB.SUGGESTIONS}
            disableRipple
            label={
              <div>
                <Badge
                  showZero
                  badgeContent={nSuggestions}
                  color={suggestionColor}
                  sx={tabBadgeStyle}
                >
                  SUGGESTIONS
                </Badge>
              </div>
            }
          />
          <Tab
            value={TAB.THREATS}
            disableRipple
            label={
              <div>
                <Badge
                  showZero
                  badgeContent={threats.length}
                  color={threatColor}
                  sx={tabBadgeStyle}
                >
                  THREATS
                </Badge>
              </div>
            }
          />
          <Tab
            value={TAB.CONTROLS}
            disableRipple
            label={
              <div>
                <Badge
                  showZero
                  badgeContent={controls.length}
                  color={controlColor}
                  sx={tabBadgeStyle}
                >
                  CONTROLS
                </Badge>
              </div>
            }
          />
        </Tabs>
      </Grow>
    </AppBar>
  );
}
