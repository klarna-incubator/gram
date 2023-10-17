import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { Box, DialogContentText, Typography } from "@mui/material";
import { useListThreatsQuery } from "../../../api/gram/threats";
import { useComponent } from "../hooks/useComponent";
import { Threat } from "../panels/right/Threat";
import { useModelID } from "../hooks/useModelID";

function ComponentActionItem({ componentId, threats }) {
  const component = useComponent(componentId);

  return (
    <Box sx={{ paddingBottom: "10px" }}>
      <Typography>{component.name}</Typography>
      {threats.map((th) => (
        <Threat threat={th} readOnly={true} />
      ))}
    </Box>
  );
}

export function ActionItemList() {
  const modelId = useModelID();
  const { data: threats } = useListThreatsQuery({ modelId });

  const actionItems = threats?.threats
    ? Object.keys(threats?.threats)
        .map((componentId) => ({
          componentId,
          threats: threats?.threats[componentId].filter(
            (th) => th.isActionItem
          ),
        }))
        .filter(({ threats }) => threats && threats.length > 0)
    : [];

  return (
    <>
      {actionItems.length > 0 && (
        <>
          <DialogContentText>
            The following threats are marked as action items.
          </DialogContentText>
          <br />
          {actionItems.map(({ componentId, threats }) => (
            <ComponentActionItem componentId={componentId} threats={threats} />
          ))}
        </>
      )}
      {actionItems.length === 0 && (
        <>
          <DialogContentText className="dimmer">
            No threats have been marked as action items.
          </DialogContentText>
          <br />
          <DialogContentText>
            <Typography className="dimmer">
              Hint: You can use the{" "}
              <AssignmentTurnedInIcon
                sx={{
                  fontSize: 20,
                  color: "#666",
                }}
              />{" "}
              button on threats in the threat tab to mark them as an action
              item.
            </Typography>
          </DialogContentText>
        </>
      )}
    </>
  );
}
