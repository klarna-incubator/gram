import { Paper, Stack, Typography } from "@mui/material";
import { CollapsePaper } from "../../../elements/CollapsePaper";
import { SeveritySlider } from "../../elements/SeveritySlider";
import { useUpdateThreatMutation } from "../../../../api/gram/threats";

export function ThreatAssessment({
  threat,
  hideSeverityDescription,
  readOnly,
}) {
  const [updateThreat] = useUpdateThreatMutation();

  return (
    <CollapsePaper
      title={"Assessment"}
      defaultExpanded={true}
      sx={{ marginTop: "10px" }}
    >
      <Stack spacing={1} sx={{ padding: "5px" }}>
        <Paper elevation={24} sx={{ padding: "5px" }}>
          <Typography variant="caption">Severity</Typography>
          <SeveritySlider
            hideDescription={hideSeverityDescription}
            onChange={(v) => {
              updateThreat({
                modelId: threat.modelId,
                id: threat.id,
                severity: v,
              });
            }}
            disabled={readOnly}
            severity={threat.severity}
            valueLabelDisplay="off"
          />
        </Paper>
      </Stack>
    </CollapsePaper>
  );
}
