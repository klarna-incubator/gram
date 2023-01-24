import {
  Circle as CircleIcon,
  ClearRounded as ClearRoundedIcon,
} from "@mui/icons-material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { Box, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useCreateControlMutation } from "../../../../api/gram/controls";
import {
  useCreateMitigationMutation,
  useListMitigationsQuery,
} from "../../../../api/gram/mitigations";
import { useGetModelPermissionsQuery } from "../../../../api/gram/model";
import {
  useDeleteThreatMutation,
  useUpdateThreatMutation,
} from "../../../../api/gram/threats";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { PERMISSIONS } from "../../constants";
import { useComponentControls } from "../../hooks/useComponentControls";
import { useModelID } from "../../hooks/useModelID";
import { EditableSelect } from "./EditableSelect";
import { EditableTypography } from "./EditableTypography";
import { MitigationChip } from "./MitigationChip";

export function Threat({
  threat,
  scrollToId,
  selected,
  readOnly: propReadOnly,
}) {
  const modelId = useModelID();
  const [deleteThreat] = useDeleteThreatMutation();
  const [updateThreat] = useUpdateThreatMutation();
  const [createControl] = useCreateControlMutation();
  const [createMitigation] = useCreateMitigationMutation();

  const [title, setTitle] = useState(threat.title);
  const [description, setDescription] = useState(threat.description);

  const controls = useComponentControls(threat.componentId);
  const { data: mitigations } = useListMitigationsQuery({ modelId });
  const threatsMap = mitigations?.threatsMap || {};

  const readOnly = useReadOnly() || propReadOnly;
  const { data: permissions } = useGetModelPermissionsQuery({ modelId });
  const reviewAllowed = permissions?.includes(PERMISSIONS.REVIEW);

  const linkedControls = controls.filter((c) =>
    threatsMap[threat.id]?.includes(c.id)
  );

  console.log(threat.componentId, controls, linkedControls);

  //TODO clean this up, not the correct way to use useEffect imo
  useEffect(() => {
    if (title !== threat.title || description !== threat.description) {
      updateThreat({
        modelId: threat.modelId,
        id: threat.id,
        title: title,
        description: description,
      });
    }
    // eslint-disable-next-line
  }, [title, description]);

  function createControlWithMitigation(title) {
    createControl({
      modelId: threat.modelId,
      control: {
        title,
        componentId: threat.componentId,
        threatIds: [threat.id],
      },
    });
  }

  function onSelectExisting(control) {
    createMitigation({
      modelId: threat.modelId,
      threatId: threat.id,
      controlId: control.id,
    });
  }

  const controlIds = threatsMap[threat.id];
  let mitigated = null;
  if (
    controlIds?.length > 0 &&
    controls?.reduce(
      (p, c) => (controlIds.includes(c.id) ? c.inPlace && p : p),
      true
    )
  ) {
    mitigated = true;
  } else if (controlIds?.length > 0) {
    mitigated = false;
  }

  const threatColor =
    mitigated === true ? "success" : mitigated === false ? "warning" : "error";

  return (
    <Card
      elevation={2}
      sx={{
        flexShrink: 0,
        border: 2,
        ...(selected
          ? {
              borderColor: (theme) => theme.palette.common.klarnaPink,
            }
          : {
              borderColor: "transparent",
            }),
      }}
    >
      <CardContent
        sx={{
          padding: "8px",
          ...(readOnly
            ? { paddingBottom: "8px !important" }
            : { paddingBottom: "16px !important" }),
        }}
      >
        <Box sx={{ display: "flex" }}>
          <Box sx={{ flexGrow: "1" }}>
            <Box display="flex" alignItems="center" gap="5px">
              <CircleIcon
                sx={{
                  fontSize: 15,
                }}
                color={threatColor}
              />
              {reviewAllowed && (
                <Tooltip title="Mark as action item">
                  <IconButton
                    onClick={() =>
                      updateThreat({
                        id: threat.id,
                        modelId: threat.modelId,
                        isActionItem: !threat.isActionItem,
                      })
                    }
                    disabled={readOnly}
                  >
                    <AssignmentTurnedInIcon
                      sx={{
                        fontSize: 20,
                        color: threat.isActionItem ? "#fff" : "#666",
                      }}
                    />
                  </IconButton>
                </Tooltip>
              )}
              <EditableTypography
                text={title}
                placeholder="Title"
                variant="body1"
                color="text.primary"
                onSubmit={setTitle}
                readOnly={readOnly}
                sx={{
                  lineHeight: "1.4",
                  fontSize: "1.0rem",
                }}
              />

              {!readOnly && (
                <Tooltip title="Delete Threat">
                  <IconButton
                    onClick={() =>
                      deleteThreat({ modelId: threat.modelId, id: threat.id })
                    }
                    sx={{ marginLeft: "auto", alignSelf: "flex-start" }}
                  >
                    <ClearRoundedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <EditableTypography
              text={description}
              placeholder={
                readOnly
                  ? "No description provided."
                  : "Add description (optional)"
              }
              variant="body1"
              color={description ? "text.secondary" : "text.disabled"}
              onSubmit={setDescription}
              readOnly={readOnly}
              sx={{
                paddingBottom: "10px",
                lineHeight: "1.45",
                fontSize: "0.75rem",
              }}
            />
          </Box>
        </Box>
        {linkedControls.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              flexWrap: "wrap",
              gap: "5px",
              paddingTop: "0",
              paddingBottom: "10px",
            }}
            component="ul"
          >
            {linkedControls.map((c) => (
              <MitigationChip
                threatId={threat.id}
                modelId={threat.modelId}
                controlId={c.id}
                title={c.title}
                inPlace={c.inPlace}
                key={c.id}
                isControl={true}
                scrollToId={scrollToId}
                readOnly={readOnly}
              />
            ))}
          </Box>
        )}

        {!readOnly && (
          <EditableSelect
            placeholder="Add Control"
            options={controls.filter(
              (c) => !linkedControls.map((l) => l.id).includes(c.id)
            )}
            selectExisting={onSelectExisting}
            createNew={createControlWithMitigation}
          />
        )}
      </CardContent>
    </Card>
  );
}
