import { MoreVertRounded, OpenInBrowserRounded } from "@mui/icons-material";
import {
  Chip,
  IconButton,
  Link,
  TableCell,
  TableRow as MuiTableRow,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useChangeReviewerMutation } from "../../api/gram/review";
import { DateLabel } from "../elements/DateLabel";
import { ReviewerDropdown } from "../elements/ReviewerDropdown";
import { SystemName } from "./SystemName";

export function TableRow(props) {
  const {
    review,
    isAdmin,
    userEmail,
    setOptionsEl,
    setOptionsReview,
    reviewStatuses,
  } = props;

  // const [expand, setExpand] = useState(false);
  const [changeReviewer] = useChangeReviewerMutation();

  const columnWidth = `20%`;

  return (
    <MuiTableRow>
      <TableCell width={columnWidth}>
        <Link component={RouterLink} to={`/model/${review.modelId}`}>
          {review.model.systemId !== "00000000-0000-0000-0000-000000000000" ? (
            <div>
              <Typography>
                {review.model.systemId && (
                  <SystemName systemId={review.model.systemId} />
                )}
              </Typography>
              <Typography variant={"body2"}>{review.model.version}</Typography>
            </div>
          ) : (
            <div>
              <Typography>{review.model.version}</Typography>
              <Typography variant={"body2"}>(standalone model)</Typography>
            </div>
          )}
        </Link>
      </TableCell>
      <TableCell>
        {review.systemProperties
          .filter((prop) => prop.displayInList)
          .filter((prop) => prop.value && prop.value !== "false")
          .map((prop) => (
            <Chip label={prop.label} />
          ))}
      </TableCell>
      <TableCell width={columnWidth}>
        {reviewStatuses.find((status) => status.value === review.status).label}
      </TableCell>
      <TableCell width={columnWidth}>
        <DateLabel ts={review.updatedAt} detailed />
      </TableCell>
      {isAdmin ? (
        <TableCell width={columnWidth}>
          <ReviewerDropdown
            modelId={review.modelId}
            value={review.reviewedBy}
            onChange={(newReviewer) =>
              changeReviewer({ modelId: review.modelId, newReviewer })
            }
          />
        </TableCell>
      ) : (
        <TableCell width={columnWidth}>{review.reviewedBy}</TableCell>
      )}
      <TableCell width={"80px"} align={"right"}>
        <IconButton component={RouterLink} to={`/model/${review.modelId}`}>
          <OpenInBrowserRounded />
        </IconButton>

        <IconButton
          onClick={(e) => {
            setOptionsEl(e.currentTarget);
            setOptionsReview(review);
          }}
          disabled={
            !(
              (review.reviewedBy === userEmail &&
                (review.status === "requested" ||
                  review.status === "meeting-requested")) ||
              ((isAdmin || review.requestedBy === userEmail) &&
                review.status !== "approved" &&
                review.status !== "canceled")
            )
          }
        >
          <MoreVertRounded />
        </IconButton>
      </TableCell>
    </MuiTableRow>
  );
}
