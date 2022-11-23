import { Icon } from "@iconify/react";
import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  MoreVertRounded,
  OpenInBrowserRounded,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Link,
  TableCell,
  TableRow as MuiTableRow,
  Typography,
} from "@mui/material";
import { Fragment, useState } from "react";
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

  const [expand, setExpand] = useState(false);
  const [changeReviewer] = useChangeReviewerMutation();

  const columnWidth = `20%`;

  return (
    <Fragment>
      <MuiTableRow>
        <TableCell width={"1%"}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setExpand((prevExpand) => !prevExpand)}
          >
            {expand ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
          </IconButton>
        </TableCell>
        <TableCell width={columnWidth}>
          <Link component={RouterLink} to={`/model/${review.modelId}`}>
            {review.model.systemId !==
            "00000000-0000-0000-0000-000000000000" ? (
              <div>
                <Typography>
                  {review.model.systemId && (
                    <SystemName systemId={review.model.systemId} />
                  )}
                </Typography>
                <Typography variant={"body2"}>
                  {review.model.version}
                </Typography>
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
          {
            reviewStatuses.find((status) => status.value === review.status)
              .label
          }
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
      <MuiTableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          {review.requester && (
            <Collapse in={expand} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1, marginLeft: 8.2 }}>
                <Card elevation={3} sx={{ display: "inline-flex" }}>
                  <CardContent
                    sx={{ padding: 1.5, ":last-child": { paddingBottom: 1.5 } }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ marginBottom: 1 }}
                    >
                      Requester
                    </Typography>
                    <Box
                      sx={{
                        margin: 0,
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ margin: 0 }}>
                        {review.requester.name &&
                          review.requester.name !== "unknown" && (
                            <Typography variant="body2">
                              {review.requester.name}
                            </Typography>
                          )}
                        <Typography variant="body2">
                          {review.requestedBy}
                        </Typography>
                        {review.requester.teams &&
                          review.requester.teams?.length > 0 && (
                            <Typography variant="body2">
                              {review.requester.teams[0]?.name}
                            </Typography>
                          )}
                      </Box>
                      {review.requester.slackId &&
                        review.requester.slackId !== "unknown" && (
                          <IconButton
                            href={`slack://user?team=T024Q7ZC6&id=${review.requester.slackId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Icon icon="mdi:slack" />
                          </IconButton>
                        )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Collapse>
          )}
        </TableCell>
      </MuiTableRow>
    </Fragment>
  );
}
