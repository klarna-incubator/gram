import { Paper, Typography } from "@mui/material";
import { useUpdateThreatMutation } from "../../../../api/gram/threats";
import { SeveritySlider } from "../../elements/SeveritySlider";

export function ThreatAssessment({
  threat,
  hideSeverityDescription,
  readOnly,
}) {
  const [updateThreat] = useUpdateThreatMutation();

  return (
    <Paper elevation={24} sx={{ padding: "5px", marginTop: "5px" }}>
      <Typography variant="caption" sx={{ paddingLeft: "5px" }}>
        Severity
      </Typography>
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
  );
}
