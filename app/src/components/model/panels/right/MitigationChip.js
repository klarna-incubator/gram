import { Cancel as CancelIcon } from "@mui/icons-material";
import { Chip, Switch, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useUpdateControlMutation } from "../../../../api/gram/controls";
import { useDeleteMitigationMutation } from "../../../../api/gram/mitigations";
import { TAB } from "./constants";

export function MitigationChip(props) {
  const {
    threatId,
    modelId,
    controlId,
    title,
    inPlace,
    isControl,
    scrollToId,
    readOnly,
  } = props;

  const [controlInPlace, setControlInPlace] = useState(inPlace);
  const [childTooltipUsed, setChildTooltipUsed] = useState(false);
  const [parentTooltipUsed, setParentTooltipUsed] = useState(false);
  const [updateControl] = useUpdateControlMutation();
  const [deleteMitigation] = useDeleteMitigationMutation();

  useEffect(() => {
    setControlInPlace(inPlace);
  }, [inPlace]);

  function onDelete() {
    deleteMitigation({ modelId, threatId: threatId, controlId: controlId });
  }

  function toggleInPlace() {
    setControlInPlace(!controlInPlace);
    updateControl({
      id: controlId,
      modelId: modelId,
      inPlace: !controlInPlace,
    });
  }

  return (
    <Tooltip
      title={title}
      open={!childTooltipUsed && parentTooltipUsed}
      disableHoverListener
    >
      <Chip
        onMouseEnter={() => setParentTooltipUsed(true)}
        onMouseLeave={() => setParentTooltipUsed(false)}
        label={title}
        onDelete={() => onDelete()}
        onClick={(e) => {
          if (e.target.type !== "checkbox") {
            isControl
              ? scrollToId(controlId, TAB.CONTROLS)
              : scrollToId(threatId, TAB.THREATS);
          }
        }}
        icon={
          isControl ? (
            <Tooltip
              title={controlInPlace ? "Set to pending" : "Set to in-place"}
              onOpen={() => setChildTooltipUsed(true)}
              onClose={() => setChildTooltipUsed(false)}
            >
              <Switch
                disableRipple
                checked={controlInPlace}
                onChange={(e) => toggleInPlace()}
                size="small"
                color="success"
                disabled={readOnly}
              />
            </Tooltip>
          ) : (
            <></>
          )
        }
        deleteIcon={
          <Tooltip
            title="Clear Mitigation"
            onOpen={() => setChildTooltipUsed(true)}
            onClose={() => setChildTooltipUsed(false)}
          >
            <CancelIcon style={readOnly ? { pointerEvents: "none" } : {}} />
          </Tooltip>
        }
        sx={{
          cursor: "alias",
          maxWidth: "100%",
          "& .MuiSwitch-root": {
            marginRight: "0px",
            marginLeft: "4px",
            ...(readOnly
              ? {
                  cursor: "alias",
                }
              : {
                  cursor: "pointer",
                }),
          },
          "& .MuiChip-label": {
            paddingRight: "2px",
            paddingLeft: isControl ? "0px" : "10px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          "& .MuiChip-deleteIcon": {
            marginLeft: "0px",
            ...(readOnly
              ? {
                  cursor: "alias",
                  color: "rgba(255, 255, 255, 0.15)",
                  "&:hover": {
                    color: "rgba(255, 255, 255, 0.26)",
                  },
                }
              : {
                  cursor: "pointer",
                }),
          },
        }}
      />
    </Tooltip>
  );
}
