import {
  Cancel as CancelIcon,
  DescriptionRounded as DescriptionRoundedIcon,
  KeyboardArrowDown,
  LockRounded as LockClosedRounded,
  LockOpenRounded,
  ThumbUpRounded as ThumbUpRoundedIcon,
  TodayRounded as TodayRoundedIcon,
  VisibilityRounded as VisibilityRoundedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useGetUserQuery } from "../../../../api/gram/auth";
import { useGetModelPermissionsQuery } from "../../../../api/gram/model";
import { useGetReviewQuery } from "../../../../api/gram/review";
import { useReviewExpiration } from "../../../../hooks/useReviewExpiration";
import { modalActions } from "../../../../redux/modalSlice";
import { UserChip } from "../../../elements/UserChip";
import { MODALS } from "../../../elements/modal/ModalManager";
import { PERMISSIONS } from "../../constants";
import { useModelID } from "../../hooks/useModelID";

const ReviewContent = (review) => {
  const { hasExpired, validUntil, aboutToExpire } = useReviewExpiration(
    review?.approved_at
  );

  return {
    default: {
      title: "Threat model not reviewed",
      description: 'Press the "Request Review" button below to get started!',
      buttons: [],
      button: RequestReviewButton,
      components: [],
      color: "error",
    },
    requested: {
      title: "Threat model under review",
      description: "",
      buttons: [
        ApproveButton,
        RequestMeetingButton,
        ReassignReviewButton,
        CancelReviewButton,
      ],
      components: [ReviewRequestedBy, ReviewReviewedBy],
      color: "warning",
    },
    approved: {
      title: hasExpired
        ? "Approved (expired)"
        : aboutToExpire
        ? "Approved (will soon expire)"
        : "Approved",
      description: `Approved by ${review?.reviewer?.name} on ${new Date(
        review?.approved_at
      ).toLocaleDateString()} and valid until ${validUntil.toLocaleDateString()}. To update this model, create a new model based on this one and have it reviewed again.`,
      buttons: [],
      components: [],
      color: hasExpired ? "error" : aboutToExpire ? "warning" : "success",
    },
    canceled: {
      title: "Threat model not reviewed",
      description: 'Press the "Request Review" button below to get started!',
      buttons: [],
      button: RequestReviewButton,
      components: [],
      color: "error",
    },
    "meeting-requested": {
      title: "Meeting requested",
      description: review?.reviewer?.calendarLink
        ? `Please use the link below to schedule a threat modelling session with ${review?.reviewer?.name}.`
        : "",
      buttons: [
        ApproveButton,
        BookMeetingButton,
        ReassignReviewButton,
        CancelReviewButton,
      ],
      components: [ReviewRequestedBy, ReviewReviewedBy],
      color: "warning",
    },
  };
};

function ReassignReviewButton({ permissions, modelId, handleClose }) {
  const dispatch = useDispatch();

  if (
    !permissions.includes(PERMISSIONS.WRITE) &&
    !permissions.includes(PERMISSIONS.REVIEW)
  ) {
    return <></>;
  }

  return (
    <MenuItem
      color="inherit"
      variant="outlined"
      // sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
      onClick={() => {
        dispatch(
          modalActions.open({
            type: MODALS.ChangeReviewer.name,
            props: { modelId },
          })
        );
        handleClose();
      }}
    >
      <ListItemIcon>
        <VisibilityRoundedIcon />
      </ListItemIcon>
      <ListItemText>Change Reviewer</ListItemText>
    </MenuItem>
  );
}

function CancelReviewButton({ permissions, modelId, handleClose }) {
  const dispatch = useDispatch();

  if (!permissions.includes(PERMISSIONS.WRITE)) {
    return <></>;
  }

  return (
    <MenuItem
      color="inherit"
      variant="outlined"
      // sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
      onClick={() => {
        dispatch(
          modalActions.open({
            type: MODALS.CancelReview.name,
            props: { modelId },
          })
        );
        handleClose();
      }}
    >
      <ListItemIcon>
        <CancelIcon />
      </ListItemIcon>
      <ListItemText>Cancel Review</ListItemText>
    </MenuItem>
  );
}

function RequestReviewButton({ permissions, modelId }) {
  const dispatch = useDispatch();

  return (
    <Button
      startIcon={<VisibilityRoundedIcon />}
      disabled={!permissions.includes(PERMISSIONS.WRITE)}
      color="inherit"
      variant="outlined"
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
      onClick={() => {
        dispatch(
          modalActions.open({
            type: MODALS.RequestReview.name,
            props: { modelId },
          })
        );
      }}
    >
      Request Review
    </Button>
  );
}

function ReadOnlyLockIcon(isLoading, review) {
  if (isLoading) return null;

  return review?.status === "approved" ? (
    <Tooltip title="This model is read-only" placement="right">
      <LockClosedRounded color="inherit" />
    </Tooltip>
  ) : (
    <Tooltip
      title="This model can be edited by authorised teams"
      placement="right"
    >
      <LockOpenRounded />
    </Tooltip>
  );
}

function EditNoteButton({ permissions, modelId, review, handleClose }) {
  const dispatch = useDispatch();

  const editOrView = permissions.includes(PERMISSIONS.REVIEW)
    ? review && review.note.trim().length === 0
      ? "Add"
      : "Edit"
    : "View";

  return (
    <Button
      startIcon={<DescriptionRoundedIcon />}
      disabled={
        !permissions.includes(PERMISSIONS.REVIEW) &&
        !permissions.includes(PERMISSIONS.READ)
      }
      color="inherit"
      variant="outlined"
      onClick={() => {
        dispatch(
          modalActions.open({ type: MODALS.EditNote.name, props: { modelId } })
        );
      }}
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
      disableRipple
    >
      {editOrView} Note
    </Button>
  );
}

function ApproveButton({ permissions, review, modelId, handleClose }) {
  const dispatch = useDispatch();
  const { data: user } = useGetUserQuery();

  if (
    user?.sub !== review?.reviewer?.sub ||
    !permissions.includes(PERMISSIONS.REVIEW)
  ) {
    return <></>;
  }

  return (
    <MenuItem
      onClick={() => {
        dispatch(
          modalActions.open({
            type: MODALS.ApproveReview.name,
            props: { modelId },
          })
        );
        handleClose();
      }}
      disableRipple
    >
      <ListItemIcon>
        <ThumbUpRoundedIcon />
      </ListItemIcon>
      <ListItemText>Approve Review</ListItemText>
    </MenuItem>
  );
}

function RequestMeetingButton({ permissions, review, modelId, handleClose }) {
  const dispatch = useDispatch();
  const { data: user } = useGetUserQuery();

  if (
    user?.sub !== review?.reviewer?.sub ||
    !permissions.includes(PERMISSIONS.REVIEW)
  ) {
    return <></>;
  }

  return (
    <MenuItem
      color="inherit"
      variant="outlined"
      onClick={() => {
        dispatch(
          modalActions.open({
            type: MODALS.RequestMeeting.name,
            props: { modelId },
          })
        );
        handleClose();
      }}
      // sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
    >
      <ListItemIcon>
        <TodayRoundedIcon />
      </ListItemIcon>
      <ListItemText>Request Meeting</ListItemText>
    </MenuItem>
  );
}

function BookMeetingButton({ permissions, review, handleClose }) {
  if (!review?.reviewer?.calendarLink) return <></>;

  return (
    <MenuItem
      disabled={!permissions.includes(PERMISSIONS.WRITE)}
      color="inherit"
      variant="outlined"
      target="_blank"
      href={review.reviewer.calendarLink}
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
    >
      <ListItemIcon>
        <TodayRoundedIcon />
      </ListItemIcon>
      <ListItemText>Schedule Meeting</ListItemText>
    </MenuItem>
  );
}

function ReviewRequestedBy(props) {
  const { review } = props;

  return (
    <>
      {review?.requester && (
        <>
          <Typography variant="caption">Requested by</Typography>&nbsp;
          <UserChip user={review?.requester} />
        </>
      )}
    </>
  );
}

function ReviewReviewedBy(props) {
  const { review } = props;

  return (
    <>
      {review?.reviewer && (
        <>
          <Typography variant="caption">Assigned to</Typography>&nbsp;
          <UserChip user={review?.reviewer} />
        </>
      )}
    </>
  );
}

export function Review() {
  const modelId = useModelID();

  const {
    data: review,
    error: reviewError,
    isLoading: reviewIsLoading,
  } = useGetReviewQuery({ modelId });

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });

  const isLoading = reviewIsLoading || permissionsIsLoading;
  const reviewStatus = reviewError ? "default" : review?.status;

  const content = ReviewContent(review)[reviewStatus];

  const [anchorEl, setAnchorEl] = useState();
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      id="panel-left-review"
      sx={
        !isLoading
          ? {
              backgroundColor: (theme) => theme.palette[content.color].main,
              color: (theme) => theme.palette.review.text,
            }
          : {}
      }
    >
      <CardContent>
        <Box display="flex" flexDirection="column" gap="5px">
          <Typography
            sx={{
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {isLoading ? <Skeleton /> : content.title}
            {ReadOnlyLockIcon(isLoading, review)}
          </Typography>

          <Box sx={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {isLoading ? (
              <Skeleton width="33%" height="2rem" />
            ) : (
              <>
                {content.components.map((Component) => (
                  <Box key={Component.name}>
                    <Component review={review} content={content} />
                  </Box>
                ))}
              </>
            )}
          </Box>
          <Typography variant="caption">
            {isLoading ? (
              <>
                <Skeleton />
                <Skeleton width="50%" />
              </>
            ) : (
              content.description
            )}
          </Typography>
          <Box sx={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {isLoading ? (
              <>
                <Skeleton width="33%" height="2rem" />
                <Skeleton width="33%" height="2rem" />
                <Skeleton width="33%" height="2rem" />
              </>
            ) : (
              <>
                <EditNoteButton
                  permissions={permissions}
                  review={review}
                  modelId={modelId}
                />

                {content.button && (
                  <content.button
                    permissions={permissions}
                    review={review}
                    modelId={modelId}
                  />
                )}

                {content.buttons.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleClick}
                      endIcon={<KeyboardArrowDown />}
                      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
                    >
                      Update
                    </Button>

                    <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                      {content.buttons.map((Action) => (
                        <Action
                          key={Action.name}
                          permissions={permissions}
                          review={review}
                          modelId={modelId}
                          handleClose={handleClose}
                        />
                      ))}
                    </Menu>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
