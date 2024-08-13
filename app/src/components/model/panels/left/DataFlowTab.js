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
import {
  useCreateFlowMutation,
  useListFlowsQuery,
} from "../../../../api/gram/flows";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useModelID } from "../../hooks/useModelID";
import { usePatchDataFlow } from "../../hooks/usePatchDataFlow";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { Flow } from "./Flow";
import { useComponent } from "../../hooks/useComponent";
import { useGetFlowAttributesQuery } from "../../../../api/gram/attributes";

function shouldBlur(e) {
  if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
    e.preventDefault();
    e.target.blur();
  }
}

export function DataFlowTab() {
  const dataflow = useSelectedComponent();
  const readOnly = useReadOnly();
  const modelId = useModelID();
  const patchDataFlow = usePatchDataFlow(dataflow.id);

  const [createFlow] = useCreateFlowMutation();
  const { data: flows, isLoading } = useListFlowsQuery({
    modelId: modelId,
    dataFlowId: dataflow.id,
  });

  const [label, setLabel] = useState(dataflow.label || "");
  const { data: attributes } = useGetFlowAttributesQuery();
  const nonOptionalAttributes = attributes?.filter(att => !att.optional) || [];
  const defaultAttributes = {};
  nonOptionalAttributes.forEach(att => {
    defaultAttributes[att.key] = att.defaultValue;
  });
  const startComponent = useComponent(dataflow.startComponent.id);
  const endComponent = useComponent(dataflow.endComponent.id);

  console.log(dataflow, startComponent, endComponent);

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
                  Flows from {startComponent.name} to {endComponent.name}
                </Typography>

                <Tooltip title="Add flow">
                  <IconButton
                    onClick={() =>
                      createFlow({
                        modelId,
                        dataFlowId: dataflow.id,
                        summary: "New Flow",
                        originComponentId: startComponent.id,
                        attributes: defaultAttributes,
                      })
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
            {isLoading && <Typography>Loading...</Typography>}

            {!isLoading &&
              flows
                .filter((flow) => flow.originComponentId === startComponent.id)
                .map((flow, index) => (
                  <Flow flow={flow} defaultExpanded={index === 0} />
                ))}
          </CardContent>
        </Card>

        {dataflow.bidirectional && (
          <Card elevation={4}>
            <CardHeader
              title={
                <Box display="flex" flexDirection="row">
                  <Typography variant="h6" sx={{ flexGrow: "1" }}>
                    Flows from {endComponent.name} to {startComponent.name}
                  </Typography>

                  <Tooltip title="Add flow">
                    <IconButton
                      onClick={() =>               
                        createFlow({
                          modelId,
                          dataFlowId: dataflow.id,
                          summary: "New Flow",
                          originComponentId: endComponent.id,
                          attributes: defaultAttributes,
                        })                        
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
              {isLoading && <Typography>Loading...</Typography>}

              {!isLoading &&
                flows
                  .filter((flow) => flow.originComponentId === endComponent.id)
                  .map((flow, index) => (
                    <Flow flow={flow} defaultExpanded={index === 0} />
                  ))}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
