import { ClearRounded as ClearRoundedIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Switch,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  useDeleteControlMutation,
  useUpdateControlMutation,
} from "../../../../api/gram/controls";
import {
  useCreateMitigationMutation,
  useListMitigationsQuery,
} from "../../../../api/gram/mitigations";
import { useCreateThreatMutation } from "../../../../api/gram/threats";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponentThreats } from "../../hooks/useSelectedComponentThreats";
import { EditableSelect } from "./EditableSelect";
import { EditableTypography } from "./EditableTypography";
import { MitigationChip } from "./MitigationChip";
import { Links } from "../../../elements/Links";
import { EditableDescription } from "../EditableDescription";

export function Control(props) {
  const { control, scrollToId, selected } = props;

  const [title, setTitle] = useState(control.title);
  const [description, setDescription] = useState(control.description);
  const [inPlace, setInPlace] = useState(control.inPlace);
  const [createThreat] = useCreateThreatMutation();
  const [deleteControl] = useDeleteControlMutation();
  const [updateControl] = useUpdateControlMutation();
  const [createMitigation] = useCreateMitigationMutation();

  const threats = useSelectedComponentThreats();

  const modelId = useModelID();
  const { data: mitigations } = useListMitigationsQuery({ modelId });
  const controlsMap = mitigations?.controlsMap || {};

  const readOnly = useReadOnly();

  const linkedThreats = threats.filter((t) =>
    controlsMap[control.id]?.includes(t.id)
  );

  useEffect(() => {
    setTitle(control.title);
    setDescription(control.description);
    setInPlace(control.inPlace);
  }, [control]);

  useEffect(() => {
    if (
      title !== control.title ||
      description !== control.description ||
      inPlace !== control.inPlace
    ) {
      updateControl({
        modelId: control.modelId,
        id: control.id,
        title: title,
        description: description,
        inPlace: inPlace,
      });
    }
    // eslint-disable-next-line
  }, [title, description, inPlace]);

  function createThreatWithMitigation(title) {
    createThreat({
      modelId: control.modelId,
      threat: {
        title: title,
        componentId: control.componentId,
        controlIds: [control.id],
      },
    });
  }

  function onSelectExisting(threat) {
    createMitigation({
      modelId: control.modelId,
      threatId: threat.id,
      controlId: control.id,
    });
  }

  function updateDescription(description) {
    updateControl({
      modelId: control.modelId,
      id: control.id,
      description: description,
    });
  }

  return (
    <Card
      elevation={2}
      sx={{
        flexShrink: 0,
        border: 2,
        ...(selected
          ? {
              borderColor: (theme) => theme.palette.common.gramPink,
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
              <Tooltip title={inPlace ? "Set to pending" : "Set to in-place"}>
                <Switch
                  disableRipple
                  checked={inPlace}
                  onChange={() => setInPlace(!inPlace)}
                  size="medium"
                  color="success"
                  disabled={readOnly}
                  sx={{ marginLeft: "auto" }}
                />
              </Tooltip>
              {!readOnly && (
                <Tooltip title="Delete Control">
                  <IconButton
                    onClick={() =>
                      deleteControl({
                        modelId: control.modelId,
                        id: control.id,
                      })
                    }
                    sx={{ alignSelf: "flex-start" }}
                  >
                    <ClearRoundedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <EditableDescription
              description={description}
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
        {linkedThreats.length > 0 && (
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
            {linkedThreats.map((t) => (
              <MitigationChip
                threatId={t.id}
                modelId={control.modelId}
                controlId={control.id}
                title={t.title}
                key={t.id}
                isControl={false}
                scrollToId={scrollToId}
                readOnly={readOnly}
              />
            ))}
          </Box>
        )}
        {!readOnly && (
          <EditableSelect
            placeholder="Add Threat"
            options={threats.filter(
              (t) => !linkedThreats.map((l) => l.id).includes(t.id)
            )}
            selectExisting={onSelectExisting}
            createNew={createThreatWithMitigation}
          />
        )}
        <Links objectType={"control"} objectId={control.id} />
      </CardContent>
    </Card>
  );
}
