import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useDispatch, useSelector } from "react-redux";
import { deleteSelected } from "../../../actions/model/deleteSelected";
import { useHasModelPermissionsWithId } from "../../../hooks/useHasModelPermissions";
import { modalActions } from "../../../redux/modalSlice";
import { COMPONENT_TYPE } from "../board/constants";
import { PERMISSIONS } from "../constants";

const NICE_COMPONENT_NAMES = {
  [COMPONENT_TYPE.EXTERNAL_ENTITY]: "External entity",
  [COMPONENT_TYPE.DATA_FLOW]: "Data flow",
  [COMPONENT_TYPE.PROCESS]: "Process",
  [COMPONENT_TYPE.DATA_STORE]: "Data store",
};

export function DeleteSelected() {
  const dispatch = useDispatch();

  const { model, selectedComponents } = useSelector(({ model }) => ({
    model,
    selectedComponents: model.components.filter((c) => c.id in model.selected),
  }));

  const readOnly = !useHasModelPermissionsWithId(model.id, PERMISSIONS.WRITE);

  function close() {
    dispatch(modalActions.close());
  }

  return (
    <Dialog open={true} scroll="paper" fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <DeleteRoundedIcon fontSize="large" />
          <Typography variant="h5">Delete Selected</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the selected items? All associated
          data (threats, controls, and mitigations) to the components will be
          deleted. The following will be deleted:
        </Typography>
        <List>
          {selectedComponents.length > 0 && (
            <Typography>{selectedComponents.length} Component(s)</Typography>
          )}
          {selectedComponents.map((c) => (
            <ListItem key={c.id} sx={{ marginBottom: "0" }}>
              <ListItemAvatar>
                {c.classes?.length > 0 ? (
                  <Avatar
                    alt="Component"
                    src={c.classes[0].icon}
                    sx={{
                      "& img": { objectFit: "contain" },
                      borderRadius: "10%",
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      backgroundColor: (theme) => theme.palette.common.gramPink,
                    }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </Avatar>
                )}
              </ListItemAvatar>
              <ListItemText
                primary={c.name}
                secondary={
                  <>
                    <Typography
                      sx={{ display: "inline" }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {NICE_COMPONENT_NAMES[c.type]}
                    </Typography>
                    {c.description && (
                      <Typography
                        sx={{ display: "inline" }}
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {" "}
                        - {c.description}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant={"outlined"} onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={readOnly}
          onClick={() => {
            dispatch(deleteSelected());
            close();
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
