import {
  Button,
  ButtonGroup,
  Chip,
  Link,
  TableCell,
  TableRow as MuiTableRow,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { useGetUserQuery } from "../../api/gram/auth";
import { useChangeReviewerMutation } from "../../api/gram/review";
import { modalActions } from "../../redux/modalSlice";
import { DateLabel } from "../elements/DateLabel";
import { MODALS } from "../elements/modal/ModalManager";
import { ReviewerDropdown } from "../elements/ReviewerDropdown";
import { reviewStatuses } from "./reviewStatuses";
import { SystemName } from "./SystemName";

export function TableRow(props) {
  const { review } = props;

  const { data: user } = useGetUserQuery();
  const isAdmin = user?.roles?.includes("admin");
  const userEmail = user?.sub;

  // const [expand, setExpand] = useState(false);
  const [changeReviewer] = useChangeReviewerMutation();
  const dispatch = useDispatch();

  return (
    <MuiTableRow>
      <TableCell>
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
      <TableCell>
        {reviewStatuses.find((status) => status.value === review.status).label}
      </TableCell>
      <TableCell>
        <DateLabel ts={review.updatedAt} detailed />
      </TableCell>
      {isAdmin ? (
        <TableCell>
          <ReviewerDropdown
            modelId={review.modelId}
            value={review.reviewedBy}
            onChange={(newReviewer) =>
              changeReviewer({ modelId: review.modelId, newReviewer })
            }
          />
        </TableCell>
      ) : (
        <TableCell>{review.reviewedBy}</TableCell>
      )}

      <TableCell align="right">
        <ButtonGroup
          variant="outlined"
          aria-label="outlined primary button group"
        >
          {review.reviewedBy === userEmail &&
            (review.status === "requested" ||
              review.status === "meeting-requested") && (
              <Button
                onClick={() => {
                  dispatch(
                    modalActions.open({
                      type: MODALS.DeclineReview.name,
                      props: { modelId: review.modelId },
                    })
                  );
                }}
              >
                Decline
              </Button>
            )}
          {(isAdmin || review.requestedBy === userEmail) &&
            review.status !== "approved" &&
            review.status !== "canceled" && (
              <Button
                onClick={() => {
                  dispatch(
                    modalActions.open({
                      type: MODALS.CancelReview.name,
                      props: { modelId: review.modelId },
                    })
                  );
                }}
              >
                Cancel
              </Button>
            )}
        </ButtonGroup>
      </TableCell>
    </MuiTableRow>
  );
}
