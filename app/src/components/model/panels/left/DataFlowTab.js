import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { usePatchDataFlow } from "../../hooks/usePatchDataFlow";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { Flow } from "./Flow";

function shouldBlur(e) {
  if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
    e.preventDefault();
    e.target.blur();
  }
}

export function DataFlowTab() {
  const dataflow = useSelectedComponent();
  const readOnly = useReadOnly();
  const patchDataFlow = usePatchDataFlow(dataflow.id);

  const [label, setLabel] = useState(dataflow.label || "");
  const [flows, setFlows] = useState(dataflow.flows || []);

  // Update controlled states if redux changed from outside the component
  useEffect(() => {
    setLabel(dataflow.label);
  }, [dataflow.label]);

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
            </Box>
          </CardContent>
        </Card>
        <Card elevation={4}>
          <CardHeader
            title={
              <Box display="flex" flexDirection="row">
                <Typography variant="h6" sx={{ flexGrow: "1" }}>
                  Flows
                </Typography>

                <Tooltip title="Add flow">
                  <IconButton
                    onClick={() =>
                      setFlows([...flows, { summary: "New Flow" }])
                    }
                    size="small"
                  >
                    <AddCircleOutlineIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          <CardContent sx={{ padding: 0 }}>
            {flows.map((flow, index) => (
              <Flow
                flow={flow}
                setFlow={(newFlow) => {
                  const newFlows = [...flows];
                  newFlows[index] = newFlow;
                  setFlows(newFlows);
                }}
                onDelete={() => {
                  const newFlows = [...flows];
                  newFlows.splice(index, 1);
                  setFlows(newFlows);
                }}
                defaultExpanded={index === 0}
              />
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
