import {
  DescriptionRounded as DescriptionRoundedIcon,
  ThumbUpRounded as ThumbUpRoundedIcon,
  TodayRounded as TodayRoundedIcon,
  VisibilityRounded as VisibilityRoundedIcon,
  LockOpenRounded,
  Cancel as CancelIcon,
  LockRounded as LockClosedRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { Fragment } from "react";
import { useDispatch } from "react-redux";
import { useGetUserQuery } from "../../../../api/gram/auth";
import { useGetModelPermissionsQuery } from "../../../../api/gram/model";
import { useGetReviewQuery } from "../../../../api/gram/review";
import { useReviewExpiration } from "../../../../hooks/useReviewExpiration";
import { modalActions } from "../../../../redux/modalSlice";
import { MODALS } from "../../../elements/modal/ModalManager";
import { PERMISSIONS } from "../../constants";
import { useModelID } from "../../hooks/useModelID";
import EmailIcon from "@mui/icons-material/Email";
import ChatIcon from "@mui/icons-material/Chat";

const ReviewContent = (review) => {
  const { hasExpired, validUntil, aboutToExpire } = useReviewExpiration(
    review?.approved_at
  );

  return {
    default: {
      title: "Threat model not reviewed",
      description: 'Press the "Request Review" button below to get started!',
      buttons: [RequestReviewButton],
      components: [],
      color: "error",
    },
    requested: {
      title: "Threat model under review",
      description: "",
      buttons: [
        EditNoteButton,
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
      buttons: [EditNoteButton],
      components: [],
      color: hasExpired ? "error" : aboutToExpire ? "warning" : "success",
    },
    canceled: {
      title: "Threat model not reviewed",
      description: 'Press the "Request Review" button below to get started!',
      buttons: [RequestReviewButton],
      components: [],
      color: "error",
    },
    "meeting-requested": {
      title: "Meeting requested",
      description: review?.reviewer?.calendarLink
        ? `Please use the link below to schedule a threat modelling session with ${review?.reviewer?.name}.`
        : "",
      buttons: [
        EditNoteButton,
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

function ReassignReviewButton({ permissions, modelId }) {
  const dispatch = useDispatch();

  if (
    !permissions.includes(PERMISSIONS.WRITE) &&
    !permissions.includes(PERMISSIONS.REVIEW)
  ) {
    return <></>;
  }

  return (
    <Button
      startIcon={<VisibilityRoundedIcon />}
      color="inherit"
      variant="outlined"
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
      onClick={() =>
        dispatch(
          modalActions.open({
            type: MODALS.ChangeReviewer.name,
            props: { modelId },
          })
        )
      }
    >
      Change Reviewer
    </Button>
  );
}

function CancelReviewButton({ permissions, modelId }) {
  const dispatch = useDispatch();

  if (!permissions.includes(PERMISSIONS.WRITE)) {
    return <></>;
  }

  return (
    <Button
      startIcon={<CancelIcon />}
      color="inherit"
      variant="outlined"
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
      onClick={() =>
        dispatch(
          modalActions.open({
            type: MODALS.CancelReview.name,
            props: { modelId },
          })
        )
      }
    >
      Cancel Review
    </Button>
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
      onClick={() =>
        dispatch(
          modalActions.open({
            type: MODALS.RequestReview.name,
            props: { modelId },
          })
        )
      }
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

function EditNoteButton({ permissions, modelId, review }) {
  const dispatch = useDispatch();

  const editOrView = permissions.includes(PERMISSIONS.REVIEW) ? "Edit" : "View";

  return (
    <Button
      startIcon={<DescriptionRoundedIcon />}
      disabled={
        !permissions.includes(PERMISSIONS.REVIEW) &&
        !permissions.includes(PERMISSIONS.READ)
      }
      color="inherit"
      variant="outlined"
      onClick={() =>
        dispatch(
          modalActions.open({ type: MODALS.EditNote.name, props: { modelId } })
        )
      }
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
    >
      {editOrView}
      {review && review.note.trim().length === 0 && " (empty)"} Note
    </Button>
  );
}

function ApproveButton({ permissions, review, modelId }) {
  const dispatch = useDispatch();
  const { data: user } = useGetUserQuery();

  if (
    user?.sub !== review?.reviewer?.sub ||
    !permissions.includes(PERMISSIONS.REVIEW)
  ) {
    return <></>;
  }

  return (
    <Button
      startIcon={<ThumbUpRoundedIcon />}
      color="inherit"
      variant="outlined"
      onClick={() =>
        dispatch(
          modalActions.open({
            type: MODALS.ApproveReview.name,
            props: { modelId },
          })
        )
      }
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
    >
      Approve
    </Button>
  );
}

function RequestMeetingButton({ permissions, review, modelId }) {
  const dispatch = useDispatch();
  const { data: user } = useGetUserQuery();

  if (
    user?.sub !== review?.reviewer?.sub ||
    !permissions.includes(PERMISSIONS.REVIEW)
  ) {
    return <></>;
  }

  return (
    <Button
      startIcon={<TodayRoundedIcon />}
      color="inherit"
      variant="outlined"
      onClick={() =>
        dispatch(
          modalActions.open({
            type: MODALS.RequestMeeting.name,
            props: { modelId },
          })
        )
      }
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
    >
      Request Meeting
    </Button>
  );
}

function BookMeetingButton({ permissions, review }) {
  if (!review?.reviewer?.calendarLink) return <></>;

  return (
    <Button
      startIcon={<TodayRoundedIcon />}
      disabled={!permissions.includes(PERMISSIONS.WRITE)}
      color="inherit"
      variant="outlined"
      target="_blank"
      href={review.reviewer.calendarLink}
      sx={{ fontSize: "12px", padding: "2px 10px 2px 10px" }}
    >
      Schedule Meeting
    </Button>
  );
}

function ReviewRequestedBy(props) {
  const { review } = props;

  return (
    <>
      {review?.requester && (
        <>
          <Typography variant="caption">Requested by</Typography>
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
          <Typography variant="caption">Assigned to</Typography>
          <UserChip user={review?.reviewer} />
        </>
      )}
    </>
  );
}

function UserChip({ user }) {
  return (
    <Chip
      size="small"
      sx={{
        color: (theme) => theme.palette.review.text,
      }}
      variant="outlined"
      label={user.name}
      icon={
        <>
          {user?.slackId && (
            <IconButton
              href={`slack://user?team=T024Q7ZC6&id=${user?.slackId}`} // TODO: remove hardcoded slack team ID here.
              target="_blank"
              rel="noreferrer"
              color="inherit"
              size="small"
            >
              <ChatIcon />
            </IconButton>
          )}
          {user?.mail && (
            <IconButton
              href={`mailto:${user?.mail}`}
              target="_blank"
              rel="noreferrer"
              color="inherit"
              size="small"
            >
              <EmailIcon />
            </IconButton>
          )}
        </>
      }
    />
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
                  <Fragment key={Component.name}>
                    <Component review={review} content={content} />
                  </Fragment>
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
                {content.buttons.map((Button) => (
                  <Button
                    key={Button.name}
                    permissions={permissions}
                    review={review}
                    modelId={modelId}
                  />
                ))}
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
