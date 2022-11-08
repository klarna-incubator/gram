import {
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { visuallyHidden } from "@mui/utils";

export function TableHeader(props) {
  const { order, toggleOrder } = props;

  const variant = "h6";

  return (
    <TableHead>
      <TableRow>
        <TableCell />
        <TableCell>
          <Typography variant={variant}>Model</Typography>
        </TableCell>
        <TableCell></TableCell>
        <TableCell>
          <Typography variant={variant}>Status</Typography>
        </TableCell>
        <TableCell>
          <TableSortLabel
            active={true}
            direction={order === "ASC" ? "asc" : "desc"}
            onClick={() => toggleOrder(order === "ASC" ? "DESC" : "ASC")}
          >
            <Typography variant={variant}>Updated</Typography>
            <Box component="span" sx={visuallyHidden}>
              {order === "desc" ? "sorted descending" : "sorted ascending"}
            </Box>
          </TableSortLabel>
        </TableCell>
        <TableCell>
          <Typography variant={variant}>Reviewer</Typography>
        </TableCell>
        <TableCell />
      </TableRow>
    </TableHead>
  );
}
