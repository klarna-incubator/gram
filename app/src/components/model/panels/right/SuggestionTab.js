import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
} from "@mui/icons-material";
import { Badge, Box, Collapse, IconButton, Paper } from "@mui/material";
import { useState } from "react";
import { useListSuggestionsQuery } from "../../../../api/gram/suggestions";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { Suggestion } from "./Suggestion";

export function SuggestionTab() {
  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const [expandRejected, setExpandRejected] = useState(false);

  const { data: suggestions } = useListSuggestionsQuery(modelId);

  const threatSuggestions = suggestions?.threatsMap[selectedComponent.id] || [];
  const controlSuggestions =
    suggestions?.controlsMap[selectedComponent.id] || [];

  const readOnly = useReadOnly();

  const nRejectedSuggestions =
    controlSuggestions.filter((t) => t.status === "rejected").length +
    threatSuggestions.filter((t) => t.status === "rejected").length;

  return (
    <Box
      sx={{
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          overflow: "auto",
          gap: "8px",
          display: "flex",
          flexDirection: "column",
          colorScheme: (theme) => theme.palette.mode,
        }}
      >
        {threatSuggestions
          .filter((t) => t.status === "new")
          .map((t) => (
            <div id={t.id} key={t.id}>
              <Suggestion
                suggestion={t}
                rejected={false}
                readOnly={readOnly}
                isControl={false}
              />
            </div>
          ))}
        {controlSuggestions
          .filter((t) => t.status === "new")
          .map((t) => (
            <div id={t.id} key={t.id}>
              <Suggestion
                suggestion={t}
                rejected={false}
                readOnly={readOnly}
                isControl={true}
              />
            </div>
          ))}
        {nRejectedSuggestions > 0 && (
          <Paper>
            <Box
              display="flex"
              alignItems="center"
              sx={{ paddingLeft: "10px", "&:hover": { cursor: "pointer" } }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setExpandRejected(!expandRejected);
                }
              }}
            >
              <Badge
                badgeContent={nRejectedSuggestions}
                onClick={() => setExpandRejected(!expandRejected)}
                sx={{
                  alignItems: "center",
                  gap: "10px",
                  "& span": {
                    position: "relative",
                    transform: "scale(1)",
                    backgroundColor: "dimgray",
                  },
                }}
              >
                REJECTED
              </Badge>
              <IconButton
                disableRipple
                size="large"
                sx={{
                  marginLeft: "auto",
                }}
                onClick={() => setExpandRejected(!expandRejected)}
              >
                {expandRejected ? (
                  <KeyboardArrowUpRounded />
                ) : (
                  <KeyboardArrowDownRounded />
                )}
              </IconButton>
            </Box>
            <Collapse in={expandRejected} timeout="auto" unmountOnExit>
              <Box display="flex" gap="8px" flexDirection="column">
                {threatSuggestions
                  .filter((t) => t.status === "rejected")
                  .map((t) => (
                    <div id={t.id} key={t.id}>
                      <Suggestion
                        suggestion={t}
                        rejected={true}
                        readOnly={readOnly}
                        isControl={false}
                      />
                    </div>
                  ))}
                {controlSuggestions
                  .filter((t) => t.status === "rejected")
                  .map((t) => (
                    <div id={t.id} key={t.id}>
                      <Suggestion
                        suggestion={t}
                        rejected={true}
                        readOnly={readOnly}
                        isControl={true}
                      />
                    </div>
                  ))}
              </Box>
            </Collapse>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
