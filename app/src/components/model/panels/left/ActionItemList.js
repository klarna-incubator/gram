import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { Box, DialogContentText, Stack, Typography } from "@mui/material";
import { CollapsePaper } from "../../../elements/CollapsePaper";
import { useActionItems } from "../../hooks/useActionItems";
import { useComponent } from "../../hooks/useComponent";
import { Threat } from "../right/Threat";

function ComponentActionItem({
  componentId,
  threats,
  defaultExpanded = false,
}) {
  const component = useComponent(componentId);

  /**
   * Fix for the case where a component was just deleted.
   */
  if (!component) return null;

  return (
    <Box sx={{ paddingBottom: "10px" }}>
      <CollapsePaper
        title={component.name}
        count={threats.length}
        defaultExpanded={defaultExpanded}
      >
        <Stack spacing={2}>
          {threats.map((th, i) => (
            <Threat
              key={`action-item-${i}`}
              threat={th}
              hideDelete={true}
              hideAddControl={true}
              hideSeverityDescription={false}
            />
          ))}
        </Stack>
      </CollapsePaper>
    </Box>
  );
}

export function ActionItemList({ automaticallyExpanded = false }) {
  const actionItems = useActionItems();

  return (
    <>
      {actionItems.length > 0 && (
        <>
          <DialogContentText>
            The following threats are marked as action items.
          </DialogContentText>

          <br />
          {actionItems.map(({ componentId, threats }) => (
            <ComponentActionItem
              key={`component-action-item-${componentId}`}
              componentId={componentId}
              threats={threats}
              defaultExpanded={automaticallyExpanded}
            />
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
