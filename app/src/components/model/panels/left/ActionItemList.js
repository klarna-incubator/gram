import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { Box, DialogContentText, Stack, Typography } from "@mui/material";
import { CollapsePaper } from "../../../elements/CollapsePaper";
import { useComponent } from "../../hooks/useComponent";
import { Threat } from "../right/Threat";
import { useListActionItemQuery } from "../../../../api/gram/action-items";
import { useModelID } from "../../hooks/useModelID";

function ComponentActionItem({
  componentId,
  actionItems,
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
        count={actionItems.length}
        defaultExpanded={defaultExpanded}
      >
        <Stack spacing={2}>
          {actionItems.map((a, i) => (
            <Threat
              key={`action-item-${i}`}
              threat={a}
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
  const modelId = useModelID();
  const {
    data: actionItems,
    isLoading,
    isError,
  } = useListActionItemQuery({ modelId });

  if (isLoading) {
    return <DialogContentText>Loading...</DialogContentText>;
  }

  if (isError) {
    return <DialogContentText>Error loading action items</DialogContentText>;
  }

  if (actionItems.length === 0) {
    return (
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
            button on threats in the threat tab to mark them as an action item.
          </Typography>
        </DialogContentText>
      </>
    );
  }

  // Group action items by component
  const components = new Map();
  actionItems.forEach((actionItem) => {
    const { componentId } = actionItem;
    if (components.has(componentId)) {
      components.get(componentId).push(actionItem);
    } else {
      components.set(componentId, [actionItem]);
    }
  });

  return (
    <>
      <DialogContentText>
        The following threats are marked as action items.
      </DialogContentText>

      <br />
      {Array.from(components).map(([componentId, actionItems]) => (
        <ComponentActionItem
          key={`component-action-item-${componentId}`}
          componentId={componentId}
          actionItems={actionItems}
          defaultExpanded={automaticallyExpanded}
        />
      ))}
    </>
  );
}
