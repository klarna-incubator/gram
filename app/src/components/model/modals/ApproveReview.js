import { ThumbUpRounded as ThumbUpRoundedIcon } from "@mui/icons-material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import {
  useApproveReviewMutation,
  useGetReviewQuery,
} from "../../../api/gram/review";
import { useListThreatsQuery } from "../../../api/gram/threats";
import { modalActions } from "../../../redux/modalSlice";
import { ColorSlider } from "../../elements/ColorSlider";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { PERMISSIONS } from "../constants";
import { useComponent } from "../hooks/useComponent";
import { Threat } from "../panels/right/Threat";

function LikelihoodSlider({ onChange }) {
  const marks = [
    {
      label: "Rare",
      description: `➢ This will probably never happen/recur
➢ Every 25 years`,
    },
    {
      label: "Unlikely",
      description: `➢ This is not likely to happen/recur but could
➢ Every 10 years`,
    },
    {
      label: "Occasional",
      description: `➢ This is unexpected to happen/recur but is certainly possible to occur
➢ Every 5 years`,
    },
    {
      label: "Likely",
      description: `➢ This will probably happen/recur but is not a persisting issue.
➢ Every 3 years`,
    },
    {
      label: "Almost certain",
      description: `➢ This will undoubtedly happen/recur
➢ Every year`,
    },
  ];

  return (
    <>
      <ColorSlider
        defaultValue={1}
        marks={marks}
        onChange={(e) => onChange(marks[e.target.value])}
      />
    </>
  );
}

function ImpactSlider({ onChange }) {
  const marks = [
    {
      label: "Very low",
      description: `➢ Users can not interact with the service <1h
➢ No regulatory sanctions/fines`,
    },
    {
      label: "Low",
      description: `➢ Users can not interact with the service <1-4h          
➢ Incident reviewed by authorities but dismissed`,
    },
    {
      label: "Medium",
      description: `➢ Users can not interact with the service <4-10h
➢ Incident reviewed by authorities and regulatory warning`,
    },
    {
      label: "High",
      description: `➢ Users can not interact with the service <10-16h  
➢ Incident reviewed by authorities and sanctions/fines imposed`,
    },
    {
      label: "Very high",
      description: `➢ Users can not interact with the service >16h          
➢ Incident reviewed by authorities and sanctions/fines threaten operations / Loss of licence`,
    },
  ];

  return (
    <ColorSlider
      defaultValue={1}
      step={null} // restricts to only these steps
      marks={marks}
      onChange={(e) => onChange(marks[e.target.value])}
    />
  );
}

function ComponentActionItem({ componentId, threats }) {
  const component = useComponent(componentId);

  return (
    <Box sx={{ paddingBottom: "10px" }}>
      <Typography>{component.name}</Typography>
      {threats.map((th) => (
        <>
          <Threat threat={th} readOnly={true} />
        </>
      ))}
    </Box>
  );
}

export function ApproveReview({ modelId }) {
  const dispatch = useDispatch();

  const { data: review } = useGetReviewQuery({ modelId });
  const [extras, setExtras] = useState({
    impact: "Low",
    likelihood: "Unlikely",
  });

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });
  const reviewAllowed = permissions?.includes(PERMISSIONS.REVIEW);

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

  const [
    approveReview,
    { isUninitialized, isLoading, isSuccess, isError, error },
  ] = useApproveReviewMutation();

  useEffect(() => {
    setLocalNote(review?.note);
  }, [review?.note]);

  const [localNote, setLocalNote] = useState("");

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <ThumbUpRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Approve threat model"}
            {isLoading && "Approving threat model"}
            {isSuccess && "Threat model approved"}
            {isError && "Error approving threat model"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {(isUninitialized || isLoading) && (
          <>
            <Divider textAlign="left">Risk Evaluation</Divider>
            {/* <DialogContentText>
              Every system threat model is connected to a risk ticket. When you
              approve this threat model, it will be automatically created for
              you (if the model is connected to a system).
            </DialogContentText> */}
            {/* <br /> */}
            <DialogContentText>
              Based on the threat model, set the risk value as your estimate of
              the overall risk of all threats/controls found in the threat
              model.
            </DialogContentText>

            <br />

            <Typography>Impact</Typography>
            <ImpactSlider
              onChange={(value) =>
                setExtras({ ...extras, impact: value.label })
              }
            />

            <br />

            <Typography>Likelihood</Typography>
            <LikelihoodSlider
              onChange={(value) =>
                setExtras({ ...extras, likelihood: value.label })
              }
            />

            <br />
            <Divider textAlign="left">Action Items</Divider>
            {actionItems.length > 0 && (
              <>
                <DialogContentText>
                  The following threats will be added as Risk Actions to
                  mitigate.
                </DialogContentText>
                <br />
                {actionItems.map(({ componentId, threats }) => (
                  <ComponentActionItem
                    componentId={componentId}
                    threats={threats}
                  />
                ))}
              </>
            )}
            {actionItems.length === 0 && (
              <>
                <DialogContentText className="dimmer">
                  No threats have been marked as action items.
                </DialogContentText>
                <DialogContentText>
                  <Typography className="dimmer">
                    Hint: You can use the{" "}
                    <AssignmentTurnedInIcon
                      sx={{
                        fontSize: 20,
                        color: "#666",
                      }}
                    />{" "}
                    button on threats in the threat tab to mark them as an
                    action item.
                  </Typography>
                </DialogContentText>
              </>
            )}

            <br />
            <Divider textAlign="left">Summary</Divider>

            <DialogContentText>
              Do you have any further recommendations to the owning team? Your
              notes here will be forwarded via email.
            </DialogContentText>
            <br />
            <TextField
              fullWidth
              multiline
              minRows={7}
              variant="outlined"
              placeholder="Write whatever you want here."
              disabled={!reviewAllowed}
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
            />
          </>
        )}
        {isSuccess && (
          <>
            <DialogContentText>
              The threat model is now registered as approved!
            </DialogContentText>
            <br />
            <DialogContentText>
              The owners of the threat model will be notified by email which
              also contains the summary of your recommendations.
            </DialogContentText>
            <br />
            <DialogContentText>
              Thank you for your contribution.
            </DialogContentText>
          </>
        )}
        {isError && (
          <>
            <DialogContentText variant="h6">
              Something went wrong :(
            </DialogContentText>
            <DialogContentText variant="caption">
              Error: {error}
            </DialogContentText>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => dispatch(modalActions.close())}
          variant="outlined"
        >
          {isUninitialized || isLoading ? "Cancel" : "Close"}
        </Button>
        {(isUninitialized || isLoading) && (
          <Button
            onClick={() => approveReview({ modelId, note: localNote, extras })}
            disabled={isLoading || permissionsIsLoading || !reviewAllowed}
            variant="contained"
          >
            Approve
            {isLoading && (
              <CircularProgress size={20} sx={{ position: "absolute" }} />
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
