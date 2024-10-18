import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  DialogActions,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { useDispatch } from "react-redux";
import { useModelID } from "../hooks/useModelID";
import { useValidateQuery } from "../../../api/gram/validation";
import { modalActions } from "../../../redux/modalSlice";
import { MODALS } from "../../elements/modal/ModalManager";

function createQualityMessage(successRatio) {
  if (successRatio === 1.0) {
    return "Good job, your threat model is ready to be reviewed.";
  } else if (successRatio >= 0.75) {
    return "Your threat model is good and can be sent for review. You can make it even better by fixing the following failed checks:";
  } else if (successRatio >= 0.5) {
    return "Your threat model might not be understood by a reviewer external to your team/domain. You can make it better by fixing the following failed checks:";
  } else {
    return "Your threat model is lacking information necessary for the reviewer to understand and approve it. Please go back to the model and fix the following failed checks:";
  }
}

export function QualityCheck() {
  const dispatch = useDispatch();
  const modelId = useModelID();
  const { data: validation } = useValidateQuery(modelId);

  const validationResults = validation?.results || [];
  const passedResults = validationResults.filter((result) => result.testResult);
  const failedResults = validationResults.filter(
    (result) => !result.testResult
  );
  const successRatio = Number(
    (passedResults.length / validationResults.length).toFixed(2)
  );

  return (
    <Dialog open={true} scroll="paper" fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <FactCheckIcon fontSize="large" />
          <Typography variant="h5">Quality check</Typography>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: 4,
        }}
      >
        <Box sx={{ display: "flex" }}>
          <Typography component="p" sx={{ width: "50%" }}>
            {createQualityMessage(successRatio)}
          </Typography>
          <CircularProgressWithLabel value={successRatio * 100} />
        </Box>
        {failedResults.length > 0 && (
          <>
            <List
              dense
              sx={{
                maxHeight: 200,
                overflow: "auto",
                border: "",
              }}
            >
              {renderResults(failedResults)}
            </List>
          </>
        )}

        <DialogActions sx={{ display: "flex", justifyContent: "end" }}>
          <Button
            variant="outlined"
            onClick={() => dispatch(modalActions.close())}
          >
            BACK TO MODEL
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              dispatch(
                modalActions.open({
                  type: MODALS.RequestReview.name,
                  props: { modelId },
                })
              );
            }}
          >
            REQUEST REVIEW
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

function renderResults(results) {
  const sortedResults = results.toSorted((a, b) => {
    return a.testResult - b.testResult;
  });

  return sortedResults.map((result, index) => {
    const { elementName, ruleName } = result;

    let itemText = (
      <Typography key={index} sx={{ fontSize: "10px" }}>
        <Typography
          component="span"
          display="inline"
          sx={{ fontStyle: "italic", fontWeight: "bold", fontSize: "0.75rem" }}
        >
          {elementName ? elementName : "Empty name"}
        </Typography>
        <Typography
          component="span"
          display="inline"
          sx={{ fontSize: "0.75rem" }}
        >
          {` ${ruleName}`}
        </Typography>
      </Typography>
    );

    return (
      <ListItem key={index} sx={{ padding: "0px 14px", margin: 0 }}>
        <ListItemIcon sx={{ color: "red", fontSize: "0.75rem" }}>
          <CloseIcon />
        </ListItemIcon>
        <ListItemText disableTypography primary={itemText} />
      </ListItem>
    );
  });
}

function CircularProgressWithLabel({ value }) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        width: "50%",
      }}
    >
      <CircularProgress
        variant="determinate"
        value={value}
        size="8rem"
        sx={{ margin: "auto" }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          component="p"
          sx={{ color: "text.secondary", fontSize: "1.5rem" }}
        >
          {`${Math.round(value)}%`}
        </Typography>
        <Typography
          variant="caption"
          component="p"
          sx={{ color: "text.secondary" }}
        >
          passed
        </Typography>
      </Box>
    </Box>
  );
}
