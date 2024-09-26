import {
  DeleteRounded as DeleteRoundedIcon,
  HelpRounded as HelpRoundedIcon,
  FactCheck as FactCheckIcon,
} from "@mui/icons-material";

// import IosShareIcon from "@mui/icons-material/IosShare";
import { Box, IconButton, Paper, Tooltip, tooltipClasses } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHasModelPermissions } from "../../../../hooks/useHasModelPermissions";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { modalActions } from "../../../../redux/modalSlice";
import { MODALS } from "../../../elements/modal/ModalManager";
import { PERMISSIONS } from "../../constants";
import { useModelID } from "../../hooks/useModelID";

export function LeftFooter() {
  const dispatch = useDispatch();

  const emptyDiagram = useSelector(
    ({ model }) => model.components.length === 0
  );

  const modelId = useModelID();

  const readOnly = useReadOnly();
  const deleteAllowed = useHasModelPermissions(PERMISSIONS.DELETE);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    setTooltipOpen(emptyDiagram);
  }, [emptyDiagram]);

  return (
    <Paper elevation={4}>
      <Box
        padding="4px 8px 4px 8px"
        display="flex"
        justifyContent="space-between"
      >
        <Tooltip title="Delete model">
          <IconButton
            disabled={readOnly || !deleteAllowed}
            onClick={() =>
              dispatch(
                modalActions.open({
                  type: MODALS.DeleteModel.name,
                  props: { modelId },
                })
              )
            }
          >
            <DeleteRoundedIcon />
          </IconButton>
        </Tooltip>
        {/* <Tooltip title="Export">
          <IconButton>
            <IosShareIcon />
          </IconButton>
        </Tooltip> */}
        <Tooltip
          title="Tutorial"
          open={tooltipOpen}
          onOpen={() => setTooltipOpen(true)}
          onClose={() => setTooltipOpen(false)}
          arrow={true}
          disableInteractive
          componentsProps={{
            popper: {
              sx: {
                ...(emptyDiagram && {
                  [`& .${tooltipClasses.arrow}`]: {
                    color: (theme) => theme.palette.warning.main,
                  },
                  [`& .${tooltipClasses.tooltip}`]: {
                    color: (theme) => theme.palette.warning.contrastText,
                    backgroundColor: (theme) => theme.palette.warning.main,
                    fontSize: (theme) => theme.typography.body1.fontSize,
                  },
                }),
              },
            },
          }}
        >
          <IconButton
            onClick={() =>
              dispatch(modalActions.open({ type: MODALS.Tutorial.name }))
            }
          >
            <HelpRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}
