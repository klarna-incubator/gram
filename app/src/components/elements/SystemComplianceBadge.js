import { Chip, Tooltip } from "@mui/material";
import { DateLabel } from "./DateLabel";

const VALIDITY_IN_DAYS = 365; // TODO: pass as configuration...
const VALIDITY_WARNING_THRESHOLD = 30;

function NoThreatModel() {
  return (
    <Tooltip title={"Has no threat model :("}>
      <Chip sx={{ width: "200px" }} label={"Has no threat model :("} />
    </Tooltip>
  );
}

export function SystemComplianceBadge({ compliance }) {
  if (!compliance) return <NoThreatModel />;
  if (compliance.pending_model_id) {
    if (compliance.pending_model_status === "requested") {
      return (
        <Tooltip title={"Threat Model is waiting for a review"}>
          <Chip
            color="info"
            sx={{ width: "200px", textAlign: "left" }}
            label={<>Review pending</>}
          />
        </Tooltip>
      );
    }

    if (compliance.pending_model_status === "meeting-requested") {
      return (
        <Tooltip
          title={"The reviewer has requested that you book a meeting with them"}
        >
          <Chip
            color="warning"
            sx={{ width: "200px", textAlign: "left" }}
            label={<>Meeting Requested</>}
          />
        </Tooltip>
      );
    }
  }

  if (compliance.approved_model_id) {
    const now = new Date();
    const validUntil = new Date(compliance.approved_at);
    validUntil.setDate(validUntil.getDate() + VALIDITY_IN_DAYS);

    const warningDate = new Date(validUntil);
    warningDate.setDate(warningDate.getDate() - VALIDITY_WARNING_THRESHOLD);

    const aboutToExpire = compliance.approved_at && warningDate <= now;
    const hasExpired = !compliance.approved_at || now > validUntil;

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
      >
        {aboutToExpire ? (
          <Chip
            color="warning"
            sx={{ width: "200px" }}
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

  if (compliance.no_review_model_id) {
    return (
      <Tooltip
        title={
          "There is a threat model, but no review has been requested (yet!)"
        }
      >
        <Chip sx={{ width: "200px" }} label={"Review not requested"} />
      </Tooltip>
    );
  }

  return <NoThreatModel />;
}
