import {
  Circle as CircleIcon,
  ClearRounded as ClearRoundedIcon,
  IosShare as IosShareIcon,
} from "@mui/icons-material";

import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { Box, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import { useCreateControlMutation } from "../../../../api/gram/controls";
import {
  useCreateMitigationMutation,
  useListMitigationsQuery,
} from "../../../../api/gram/mitigations";

import {
  useAcceptSuggestionMutation,
  useListSuggestionsQuery,
} from "../../../../api/gram/suggestions";
import {
  useDeleteThreatMutation,
  useUpdateThreatMutation,
} from "../../../../api/gram/threats";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useComponentControls } from "../../hooks/useComponentControls";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { EditableSelect } from "./EditableSelect";
import { EditableTypography } from "./EditableTypography";
import { MitigationChip } from "./MitigationChip";
import { ThreatAssessment } from "./ThreatAssessment";
import { Links } from "../../../elements/Links";
import { useDispatch } from "react-redux";
import { modalActions } from "../../../../redux/modalSlice";
import { MODALS } from "../../../elements/modal/ModalManager";
import { useListExportersQuery } from "../../../../api/gram/action-items";
import { EditableDescription } from "../EditableDescription";

export function Threat({
  threat,
  scrollToId,
  selected,
  hideDelete,
  hideAddControl,
  hideSeverityDescription,
  hideExport,
}) {
  const dispatch = useDispatch();
  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const [deleteThreat] = useDeleteThreatMutation();
  const [updateThreat] = useUpdateThreatMutation();
  const [createControl] = useCreateControlMutation();
  const [createMitigation] = useCreateMitigationMutation();
  const [acceptSuggestion] = useAcceptSuggestionMutation();
  const { data: exporters } = useListExportersQuery();

  const openExportActionItemModal = () =>
    dispatch(
      modalActions.open({
        type: MODALS.ExportActionItem.name,
        props: { threatId: threat.id },
      })
    );

  const partialThreatId = threat?.suggestionId
    ? threat.suggestionId.split("/").splice(1).join("/")
    : "";
  const { data: suggestions } = useListSuggestionsQuery(modelId);

  const controlSuggestions = (
    suggestions?.controlsMap[selectedComponent?.id] || []
  ).filter(
    (s) =>
      partialThreatId &&
      s.status === "new" &&
      s.mitigates.find((m) => m.partialThreatId === partialThreatId)
  );

  const controls = useComponentControls(threat.componentId);
  const { data: mitigations } = useListMitigationsQuery({ modelId });
  const threatsMap = mitigations?.threatsMap || {};

  const readOnly = useReadOnly();

  const linkedControls = controls.filter((c) =>
    threatsMap[threat.id]?.includes(c.id)
  );

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
    if (control.mitigates) {
      acceptSuggestion({
        modelId: modelId,
        suggestionId: control.id,
      });
    } else {
      createMitigation({
        modelId: threat.modelId,
        threatId: threat.id,
        controlId: control.id,
      });
    }
  }

  function updateDescription(newDescription) {
    updateThreat({
      modelId: threat.modelId,
      id: threat.id,
      description: newDescription,
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

              <Tooltip title="Mark as action item">
                <IconButton
                  onClick={() =>
                    updateThreat({
                      id: threat.id,
                      modelId: threat.modelId,
                      isActionItem: !threat.isActionItem,
                      severity: threat.severity || "low",
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

              <EditableTypography
                text={threat.title}
                placeholder="Title"
                variant="body1"
                color="text.primary"
                onSubmit={(v) =>
                  updateThreat({
                    modelId: threat.modelId,
                    id: threat.id,
                    title: v,
                  })
                }
                readOnly={readOnly}
                sx={{
                  lineHeight: "1.4",
                  fontSize: "1.0rem",
                }}
              />

              <Box sx={{ marginLeft: "auto", alignSelf: "flex-start" }}>
                {!readOnly && !hideExport && exporters?.length > 0 && (
                  <Tooltip title="Export Threat">
                    <IconButton
                      onClick={openExportActionItemModal}
                      size="small"
                    >
                      <IosShareIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}

                {!readOnly && !hideDelete && (
                  <Tooltip title="Delete Threat">
                    <IconButton
                      onClick={() =>
                        deleteThreat({ modelId: threat.modelId, id: threat.id })
                      }
                      size="small"
                    >
                      <ClearRoundedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
            <EditableDescription
              description={threat.description}
              updateDescription={updateDescription}
              readOnly={readOnly}
              previewSx={{
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

        {!readOnly && !hideAddControl && (
          <EditableSelect
            placeholder="Add Control"
            options={[
              ...controlSuggestions,
              ...controls.filter(
                (c) => !linkedControls.map((l) => l.id).includes(c.id)
              ),
            ]}
            selectExisting={onSelectExisting}
            createNew={createControlWithMitigation}
          />
        )}

        {threat.isActionItem && (
          <ThreatAssessment
            hideSeverityDescription={hideSeverityDescription}
            threat={threat}
            readOnly={readOnly}
          />
        )}

        <Box sx={{ marginTop: "10px" }}>
          <Links objectType={"threat"} objectId={threat.id} />
        </Box>
      </CardContent>
    </Card>
  );
}
