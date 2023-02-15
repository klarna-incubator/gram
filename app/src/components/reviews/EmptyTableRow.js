import { TableCell, TableRow as MuiTableRow } from "@mui/material";

export function EmptyTableRow() {
  return (
    <MuiTableRow>
      <TableCell colSpan={6}>
        <p>No results found</p>
      </TableCell>
    </MuiTableRow>
  );
}
