import {
  FirstPageRounded,
  KeyboardArrowLeftRounded,
  KeyboardArrowRightRounded,
  LastPageRounded,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Box } from "@mui/system";

export function TablePaginationActions(props) {
  const { count, page, rowsPerPage, onPageChange } = props;

  // Sorry for weird pagination numbering, but MUI does not like 1 indexed pagination (neither do I) :p
  function onFirstPage() {
    onPageChange(1);
  }

  function onPreviousPage() {
    onPageChange(page);
  }

  function onNextPage() {
    onPageChange(page + 2);
  }

  function onLastPage() {
    onPageChange(Math.max(1, Math.ceil(count / rowsPerPage)));
  }

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={() => onFirstPage()}
        disabled={page === 0}
        aria-label="first page"
      >
        <FirstPageRounded />
      </IconButton>
      <IconButton
        onClick={() => onPreviousPage()}
        disabled={page === 0}
        aria-label="previous page"
      >
        <KeyboardArrowLeftRounded />
      </IconButton>
      <IconButton
        onClick={() => onNextPage()}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRightRounded />
      </IconButton>
      <IconButton
        onClick={() => onLastPage()}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageRounded />
      </IconButton>
    </Box>
  );
}
