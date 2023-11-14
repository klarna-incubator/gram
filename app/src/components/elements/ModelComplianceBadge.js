import { Chip, Tooltip } from "@mui/material";
import { useReviewExpiration } from "../../hooks/useReviewExpiration";
import { DateLabel } from "./DateLabel";

function NoReview() {
  return (
    <Tooltip title={"No review has been requested yet. "}>
      <Chip
        component={"span"}
        sx={{ width: "200px" }}
        label={"Review not requested"}
      />
    </Tooltip>
  );
}

export function ModelComplianceBadge({ reviewStatus, reviewApprovedAt }) {
  const { hasExpired, validUntil, aboutToExpire } =
    useReviewExpiration(reviewApprovedAt);

  if (!reviewStatus) return <NoReview />;

  if (reviewStatus === "requested") {
    return (
      <Tooltip title={"Threat Model is waiting for a review"}>
        <Chip
          color="info"
          sx={{ width: "200px", textAlign: "left" }}
          label={<>Review pending</>}
          component={"span"}
        />
      </Tooltip>
    );
  }

  if (reviewStatus === "meeting-requested") {
    return (
      <Tooltip
        title={"The reviewer has requested that you book a meeting with them"}
      >
        <Chip
          color="warning"
          sx={{ width: "200px", textAlign: "left" }}
          label={<>Meeting Requested</>}
          component={"span"}
        />
      </Tooltip>
    );
  }

  if (reviewStatus === "approved") {
    if (hasExpired) {
      return (
        <Tooltip
          title={
            <>
              The latest threat model approval expired{" "}
              <b>
                <DateLabel ts={validUntil}></DateLabel>
              </b>
            </>
          }
        >
          <Chip
            color="error"
            sx={{ width: "200px" }}
            label={
              <>
                Approval expired <DateLabel ts={validUntil}></DateLabel>{" "}
              </>
            }
            component={"span"}
          />
        </Tooltip>
      );
    }

    return (
      <Tooltip
        title={
          <>
            {aboutToExpire && "Approval will expire soon! "}
            Valid until{" "}
            <b>
              <DateLabel ts={validUntil}></DateLabel>
            </b>
          </>
        }
        component={"span"}
      >
        {aboutToExpire ? (
          <Chip
            color="warning"
            sx={{ width: "200px" }}
            component={"span"}
            label={
              <>
                Approved until <DateLabel ts={validUntil}></DateLabel>{" "}
              </>
            }
          />
        ) : (
          <Chip
            color="success"
            sx={{ width: "200px" }}
            component={"span"}
            label={
              <>
                Approved until <DateLabel ts={validUntil}></DateLabel>{" "}
              </>
            }
          />
        )}
      </Tooltip>
    );
  }

  return <NoReview />;
}
