import { Box, Card, CardContent, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useSelectedDataFlow } from "../../hooks/useSelectedDataFlow";
import { usePatchDataFlow } from "../../hooks/usePatchDataFlow";

export function DataFlowTab() {
  const dataflow = useSelectedDataFlow();
  const readOnly = useReadOnly();
  const patchDataFlow = usePatchDataFlow(dataflow.id);

  const [label, setLabel] = useState(dataflow.label || "");
  const [description, setDescription] = useState(dataflow.description || "");

  // Update controlled states if redux changed from outside the component
  useEffect(() => {
    setLabel(dataflow.label);
  }, [dataflow.label]);

  useEffect(() => {
    setDescription(
      dataflow.description === undefined ? "" : dataflow.description
    );
  }, [dataflow.description]);

  function shouldBlur(e) {
    if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
      e.preventDefault();
      e.target.blur();
    }
  }

  return (
    <Box
      sx={{
        padding: "8px",
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" gap="20px" flexDirection="column">
              <Typography variant="h6">Properties</Typography>

              <TextField
                fullWidth
                variant="standard"
                label="Label"
                value={label}
                disabled={readOnly}
                onBlur={() => patchDataFlow({ label })}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={shouldBlur}
              />

              <TextField
                fullWidth
                multiline
                variant="standard"
                label="Description"
                disabled={readOnly}
                value={description}
                onBlur={() => patchDataFlow({ description })}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={shouldBlur}
              />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" gap="20px" flexDirection="column">
              <Typography variant="h6">Flows</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
